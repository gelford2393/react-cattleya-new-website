import { create } from "zustand";

interface CMSState {
  isPoolSheetOpen: boolean;
  editingPoolId: string | null;
  openPoolSheet: (id: string) => void;
  closePoolSheet: () => void;
}

export const useCMSStore = create<CMSState>((set) => ({
  isPoolSheetOpen: false,
  editingPoolId: null,
  openPoolSheet: (id) => set({ isPoolSheetOpen: true, editingPoolId: id }),
  closePoolSheet: () => set({ isPoolSheetOpen: false, editingPoolId: null }),
}));
