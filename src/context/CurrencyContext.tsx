"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { Currency, formatPrice, PRICES } from "@/lib/currency";

interface CurrencyContextValue {
  currency: Currency;
  price: number;
  formattedPrice: string;
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: "USD",
  price: PRICES.USD,
  formattedPrice: formatPrice(PRICES.USD, "USD"),
  isLoading: true,
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>("USD");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Allow ?currency=NGN or ?currency=USD override for testing
    const params = new URLSearchParams(window.location.search);
    const override = params.get("currency")?.toUpperCase();
    if (override === "NGN" || override === "USD") {
      setCurrency(override);
      setIsLoading(false);
      return;
    }

    // IP geolocation — free, no API key needed (30k req/day)
    fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(4000) })
      .then((res) => res.json())
      .then((data) => {
        if (data?.country_code === "NG") {
          setCurrency("NGN");
        }
      })
      .catch(() => {
        // Silently fall back to USD on any error
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        price: PRICES[currency],
        formattedPrice: formatPrice(PRICES[currency], currency),
        isLoading,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
