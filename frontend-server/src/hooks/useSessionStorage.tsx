import { useCallback } from "react";

export function useSessionStorage() {
	const setItem = useCallback((key:string, value:string) => {
		if (typeof window === "undefined") return;
		try {
			window.sessionStorage.setItem(key, JSON.stringify(value));
		} catch (error) {
			console.error(`Error saving key "${key}" to sessionStorage:`, error);
		}
	}, []);

	const getItem = useCallback((key:string, defaultValue = null) => {
		if (typeof window === "undefined") return defaultValue;
		try {
			const item = window.sessionStorage.getItem(key);
			return item !== null ? JSON.parse(item) : defaultValue;
		} catch (error) {
			console.error(`Error reading key "${key}" from sessionStorage:`, error);
			return defaultValue;
		}
	}, []);

	const removeItem = useCallback((key:string) => {
		if (typeof window === "undefined") return;
		try {
			window.sessionStorage.removeItem(key);
		} catch (error) {
			console.error(`Error removing key "${key}" from sessionStorage:`, error);
		}
	}, []);

	return { setItem, getItem, removeItem };
}
