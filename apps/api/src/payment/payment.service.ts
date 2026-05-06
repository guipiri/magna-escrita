import { BadGatewayException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { MercadoPagoProvider } from './providers/mercado-pago.provider.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { PrismaService } from '../db/db.service.js';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class PaymentService {
  constructor(
    private readonly mercadoPagoProvider: MercadoPagoProvider,
    private readonly prisma: PrismaService,
  ) {}

  async createOrder(data: CreateOrderDto, userId: string) {
    if (data.paymentMethodDetail === 'pix') {
      return this.createPixOrder(data, userId);
    }

    return this.createCardOrder(data, userId);
  }

  private async createPixOrder(data: CreateOrderDto, userId: string) {
    try {
      const bookIds = data.items.map((it) => it.bookId);
      const books = await this.prisma.book.findMany({
        where: { id: { in: bookIds } },
        include: { price: true },
      });

      let total = 0;
      for (const it of data.items) {
        const book = books.find((b) => b.id === it.bookId);
        if (!book) throw new Error(`Livro não encontrado: ${it.bookId}`);
        const unit = Number(book.price.amount);
        total += unit * it.quantity;
      }

      const totalAmount = total.toFixed(2);
      const orderId = randomUUID();

      const mpOrder = await this.mercadoPagoProvider.order.create({
        body: {
          type: 'online',
          external_reference: orderId,
          total_amount: totalAmount,
          processing_mode: 'automatic',
          payer: {
            email: data.email,
          },
          transactions: {
            payments: [
              {
                amount: totalAmount,
                payment_method: {
                  id: data.paymentMethodDetail || 'pix',
                  type: data.paymentMethod || 'bank_transfer',
                },
              },
            ],
          },
        },
      });

      const status = this.mapMercadoPagoStatus(
        mpOrder.status,
        mpOrder.status_detail,
      );

      const order = await this.prisma.order.create({
        data: {
          id: orderId,
          mpId: mpOrder.id || orderId,
          paymentMethod:
            mpOrder.transactions?.payments?.[0]?.payment_method?.id || 'pix',
          totalAmount: parseFloat(totalAmount),
          email: data.email,
          user: { connect: { id: userId } },
          installments: 1,
          identificationType: data.identificationType,
          identificationNumber: data.identificationNumber,
          status,
          items: {
            create: data.items.map((it) => {
              const book = books.find((b) => b.id === it.bookId)!;
              return {
                book: { connect: { id: it.bookId } },
                quantity: it.quantity,
                amount: Number(book.price.amount),
              };
            }),
          },
        },
      });

      return { order, mpOrder };
    } catch (error: any) {
      const providerMessage = (error as { errors?: { message?: string }[] })
        ?.errors?.[0]?.message;
      const message = providerMessage || 'Falha ao criar pedido PIX';

      throw new BadGatewayException({
        code: 'MP_CREATE_ORDER_FAILED',
        message,
        details: providerMessage ? { providerMessage } : undefined,
      });
    }
  }

  private async createCardOrder(data: CreateOrderDto, userId: string) {
    const {
      paymentMethod,
      email,
      identificationType,
      identificationNumber,
      installments = 1,
      token,
      issuerId,
      paymentMethodDetail,
    } = data;
    const bookIds = data.items.map((it) => it.bookId);
    const books = await this.prisma.book.findMany({
      where: { id: { in: bookIds } },
      include: { price: true },
    });

    let total = 0;
    for (const it of data.items) {
      const book = books.find((b) => b.id === it.bookId);
      if (!book) throw new Error(`Livro não encontrado: ${it.bookId}`);
      const unit = Number(book.price.amount);
      total += unit * it.quantity;
    }

    const totalAmount = total;
    try {
      const orderId = randomUUID();

      const mpOrder = await this.mercadoPagoProvider.order.create({
        body: {
          type: 'online',
          external_reference: orderId,
          total_amount: totalAmount.toString(),
          processing_mode: 'automatic',
          payer: { email },
          transactions: {
            payments: [
              {
                amount: totalAmount.toString(),
                payment_method: {
                  id: paymentMethod,
                  type: 'credit_card',
                  token,
                  installments,
                },
              },
            ],
          },
        },
      });

      const status = this.mapMercadoPagoStatus(
        mpOrder.status,
        mpOrder.status_detail,
      );

      const order = await this.prisma.order.create({
        data: {
          id: orderId,
          mpId: mpOrder.id || orderId,
          paymentMethod,
          paymentMethodDetail,
          totalAmount,
          email,
          user: { connect: { id: userId } },
          identificationType,
          identificationNumber,
          issuerId,
          installments,
          status,
          token,
          items: {
            create: data.items.map((it) => {
              const book = books.find((b) => b.id === it.bookId)!;
              return {
                book: { connect: { id: it.bookId } },
                quantity: it.quantity,
                amount: Number(book.price.amount),
              };
            }),
          },
        },
      });

      return { order, mpOrder };
    } catch (error: any) {
      console.error('Erro ao criar Order de Cartão:', error);
      throw new Error(`Erro ao criar Order de Cartão: ${error}`);
    }
  }

  async handleOrderWebhook(orderId: string) {
    const order = await this.mercadoPagoProvider.order.get({
      id: orderId,
    });

    return this.syncOrderStatus({
      resourceId: orderId,
      externalReference: order.external_reference,
      status: order.status,
      statusDetail: order.status_detail,
    });
  }

  async getOrder(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId, userId },
      include: { items: { include: { book: true } } },
    });

    if (!order) throw new Error('Pedido não encontrado');

    try {
      const mpOrder = await this.mercadoPagoProvider.order.get({
        id: order.mpId || orderId,
      });

      return { order, mpOrder };
    } catch (error) {
      console.error('Erro ao buscar pedido no Mercado Pago:', error);
      return { order };
    }
  }

  async listOrders(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: { items: { include: { book: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return { orders };
  }

  private async syncOrderStatus({
    resourceId,
    externalReference,
    status,
    statusDetail,
  }: {
    resourceId: string;
    externalReference?: string;
    status?: string;
    statusDetail?: string;
  }) {
    const mappedStatus = this.mapMercadoPagoStatus(status, statusDetail);
    const order = await this.prisma.order.findFirst({
      where: {
        OR: [
          ...(externalReference ? [{ id: externalReference }] : []),
          ...(resourceId ? [{ mpId: resourceId }] : []),
        ],
      },
    });

    if (!order || !mappedStatus) {
      return {
        received: true,
        resourceId,
        status: mappedStatus ?? status ?? 'unknown',
      };
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: mappedStatus,
      },
    });

    return {
      received: true,
      resourceId,
      status: mappedStatus,
      order: updatedOrder,
    };
  }

  private mapMercadoPagoStatus(
    status?: string,
    statusDetail?: string,
  ): OrderStatus {
    if (!status || !statusDetail) return OrderStatus.PENDING;

    const lowerStatus = status.toLowerCase();
    const lowerDetail = statusDetail?.toLowerCase();

    if (lowerStatus === 'processed') {
      if (lowerDetail === 'partially_refunded') {
        return OrderStatus.REFUNDED;
      }
      return OrderStatus.APPROVED;
    }

    // Status 'charged_back' com seus sub-status
    if (lowerStatus === 'charged_back') {
      if (lowerDetail === 'in_process') {
        return OrderStatus.PENDING;
      }
      if (lowerDetail === 'settled') {
        return OrderStatus.APPROVED;
      }
      if (lowerDetail === 'reimbursed') {
        return OrderStatus.REFUNDED;
      }
      return OrderStatus.CANCELED;
    }

    switch (lowerStatus) {
      case 'created':
        return OrderStatus.PENDING;
      case 'processing':
      case 'in_process':
        return OrderStatus.PENDING;
      case 'action_required':
        return OrderStatus.PENDING;
      case 'canceled':
        return OrderStatus.CANCELED;
      case 'expired':
        return OrderStatus.CANCELED;
      case 'failed':
        return OrderStatus.CANCELED;
      case 'refunded':
        return OrderStatus.REFUNDED;
      default:
        return OrderStatus.PENDING;
    }
  }
}
