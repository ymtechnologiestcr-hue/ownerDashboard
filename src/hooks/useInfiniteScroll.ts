import { useInfiniteQuery } from "@tanstack/react-query";

export const useInfiniteScroll = ({
  queryKey,
  queryFn
}: any) => {
  return useInfiniteQuery({
    queryKey,
    queryFn,
    initialPageParam: 1,
    getNextPageParam: (lastPage: any) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    }
  });
};