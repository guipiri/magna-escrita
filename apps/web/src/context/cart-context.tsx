import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

export interface CartItem {
  bookId: string;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  totalQuantity: number;
  addBook: (bookId: string) => void;
  increaseBook: (bookId: string) => void;
  decreaseBook: (bookId: string) => void;
  removeBook: (bookId: string) => void;
  clearCart: () => void;
}

const CART_STORAGE_KEY = 'magna-escrita-cart';

const CartContext = createContext<CartContextValue | undefined>(undefined);

const loadCart = (): CartItem[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const rawCart = window.localStorage.getItem(CART_STORAGE_KEY);

    if (!rawCart) {
      return [];
    }

    const parsedCart = JSON.parse(rawCart) as CartItem[];

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
  const [items, setItems] = useState<CartItem[]>(() => loadCart());

  useEffect(() => {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addBook = (bookId: string) => {
    setItems((currentItems) => {
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
    setItems((currentItems) =>
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
    setItems((currentItems) =>
      currentItems.filter((item) => item.bookId !== bookId),
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        totalQuantity,
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
