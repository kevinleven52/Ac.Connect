import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "../lib/axios.js";
import { toast } from "react-hot-toast";

const useUserStore = create(
  persist(
    (set, get) => ({
      user: null,
      loading: false,
      checkingAuth: true,

      signup: async (name, email, password, confirmPassword) => {
        set({ loading: true });
        if (password !== confirmPassword) {
          set({ loading: false });
          return toast.error("Passwords do not match");
        }
        try {
          const response = await axios.post("/auth/signup", {
            name,
            email,
            password,
            confirmPassword,
          });
          set({ user: response.data.user, loading: false, checkingAuth: false });
          toast.success("Signup successful!");
        } catch (error) {
          set({ loading: false });
          toast.error(error.response?.data?.message || "Signup failed");
        }
      },

      login: async (email, password) => {
        set({ loading: true });
        try {
          const response = await axios.post("/auth/login", { email, password });
          set({ user: response.data.user, loading: false, checkingAuth: false });
          toast.success("Login successful!");
        } catch (error) {
          set({ loading: false });
          toast.error(error.response?.data?.message || "Login failed");
        }
      },

      logout: async () => {
        set({ loading: true });
        try {
          await axios.post("/auth/logout");
          set({ user: null, loading: false });
          toast.success("Logout successful!");
        } catch (error) {
          set({ loading: false });
          toast.error(error.response?.data?.message || "Logout failed");
        }
      },

      checkAuth: async () => {
        set({ checkingAuth: true });
        try {
          const response = await axios.get("/auth/Profile");
          set({ user: response.data.user, checkingAuth: false });
        } catch {
          set({ checkingAuth: false });
        }
      },

      refreshToken: async () => {
        if (get().checkingAuth) return;
        set({ checkingAuth: true });
        try {
          const response = await axios.post("/auth/refresh-token");
          set({ checkingAuth: false });
          return response.data;
        } catch (error) {
          set({ user: null, checkingAuth: false });
          throw error;
        }
      },
    }),
    {
      name: "user-storage",
      partialize: (state) => ({ user: state.user }),
    }
  )
);



let refreshPromise = null;

axios.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;
		if (error.response?.status === 401 && !originalRequest._retry) {
			originalRequest._retry = true;

			try {
				// If a refresh is already in progress, wait for it to complete
				if (refreshPromise) {
					await refreshPromise;
					return axios(originalRequest);
				}

				// Start a new refresh process
				refreshPromise = useUserStore.getState().refreshToken();
				await refreshPromise;
				refreshPromise = null;

				return axios(originalRequest);
			} catch (refreshError) {
				// If refresh fails, redirect to login or handle as needed
				useUserStore.getState().logout();
				return Promise.reject(refreshError);
			}
		}
		return Promise.reject(error);
	}
);

export default useUserStore;
