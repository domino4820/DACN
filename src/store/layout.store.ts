import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LayoutState {
    headerHeight: number;
    contentHeight: number;
}

interface LayoutActions {
    setHeaderHeight: (height: number) => void;
    setContentHeight: (height: number) => void;
}

export const useLayoutStore = create<LayoutState & LayoutActions>()(
    persist(
        (set) => ({
            headerHeight: 0,
            contentHeight: 0,

            setHeaderHeight: (height: number) => set({ headerHeight: height }),
            setContentHeight: (height: number) => set({ contentHeight: height })
        }),
        {
            name: 'layout-storage',
            partialize: (state) => ({
                headerHeight: state.headerHeight
            })
        }
    )
);
