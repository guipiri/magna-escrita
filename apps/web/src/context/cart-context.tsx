import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useQuery } from '@tanstack/react-query';
import { getBooksByIds } from '../services/book-service';

interface StoredCartItem {
  bookId: string;
  quantity: number;
}

export interface CartItem extends StoredCartItem {
  title: string;
  author: string;
  price: number;
  lineTotal: number;
  isAvailable: boolean;
  isLoading: boolean;
}

interface CartContextValue {
  items: CartItem[];
  totalQuantity: number;
  subtotal: number;
  isLoadingBookDetails: boolean;
  isBookDetailsError: boolean;
  hasUnavailableItems: boolean;
  checkoutDisabledReason?: string;
  addBook: (bookId: string) => void;
  increaseBook: (bookId: string) => void;
  decreaseBook: (bookId: string) => void;
  removeBook: (bookId: string) => void;
  clearCart: () => void;
}

const CART_STORAGE_KEY = 'magna-escrita-cart';
const BOOK_DETAILS_UNAVAILABLE_MESSAGE =
  'Não foi possível carregar os dados dos livros. Tente novamente em instantes.';

const CartContext = createContext<CartContextValue | undefined>(undefined);

const loadCart = (): StoredCartItem[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const rawCart = window.localStorage.getItem(CART_STORAGE_KEY);

    if (!rawCart) {
      return [];
    }

    const parsedCart = JSON.parse(rawCart) as StoredCartItem[];

    if (!Array.isArray(parsedCart)) {
      return [];
    }

    return parsedCart.filter(
      (item) => typeof item.bookId === 'string' && item.quantity > 0,
    );
  } catch {
    return [];
  }
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [storedItems, setStoredItems] = useState<StoredCartItem[]>(() =>
    loadCart(),
  );

  useEffect(() => {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(storedItems));
  }, [storedItems]);

  const bookIds = storedItems.map((item) => item.bookId);
  const {
    data: books = [],
    isError: isBookDetailsError,
    isLoading: isLoadingBookDetails,
  } = useQuery({
    queryKey: ['cart-books', bookIds.join(',')],
    queryFn: () => getBooksByIds(bookIds),
    enabled: bookIds.length > 0,
    retry: 1,
    staleTime: 1000 * 60 * 5,
  });

  const booksById = new Map(books.map((book) => [book.id, book]));

  const items = storedItems.map((item): CartItem => {
    const book = booksById.get(item.bookId);
    const price = book?.price ?? 0;

    return {
      ...item,
      title: book?.title ?? 'Livro indisponível',
      author: book?.author ?? 'Não encontramos este livro no banco de dados.',
      price,
      lineTotal: price * item.quantity,
      isAvailable: Boolean(book),
      isLoading: isLoadingBookDetails,
    };
  });

  const addBook = (bookId: string) => {
    setStoredItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.bookId === bookId);

      if (existingItem) {
        return currentItems.map((item) =>
          item.bookId === bookId
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }

      return [...currentItems, { bookId, quantity: 1 }];
    });
  };

  const increaseBook = (bookId: string) => {
    addBook(bookId);
  };

  const decreaseBook = (bookId: string) => {
    setStoredItems((currentItems) =>
      currentItems
        .map((item) =>
          item.bookId === bookId
            ? { ...item, quantity: item.quantity - 1 }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const removeBook = (bookId: string) => {
    setStoredItems((currentItems) =>
      currentItems.filter((item) => item.bookId !== bookId),
    );
  };

  const clearCart = () => {
    setStoredItems([]);
  };

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const hasUnavailableItems =
    items.length > 0 &&
    !isLoadingBookDetails &&
    items.some((item) => !item.isAvailable);

  const checkoutDisabledReason = isLoadingBookDetails
    ? 'Carregando os dados dos livros antes de seguir para o pagamento.'
    : isBookDetailsError
      ? BOOK_DETAILS_UNAVAILABLE_MESSAGE
      : hasUnavailableItems
        ? 'Remova os livros indisponíveis antes de seguir para o pagamento.'
        : undefined;

  return (
    <CartContext.Provider
      value={{
        items,
        totalQuantity,
        subtotal,
        isLoadingBookDetails,
        isBookDetailsError,
        hasUnavailableItems,
        checkoutDisabledReason,
        addBook,
        increaseBook,
        decreaseBook,
        removeBook,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart deve ser usado dentro de CartProvider');
  }

  return context;
}
