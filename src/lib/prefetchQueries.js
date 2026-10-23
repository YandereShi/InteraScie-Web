export async function PrefetchQueries(queryClient, queries, isCancelled) {
  let next = 0;

  async function LoadNext() {
    while (!isCancelled() && next < queries.length) {
      const query = queries[next++];
      await queryClient.prefetchQuery({ ...query, retry: 0 });
    }
  }

  await Promise.all([LoadNext(), LoadNext()]);
}
