import { QueryKey, useQuery, UseQueryOptions } from "@tanstack/react-query";

interface IProps<TData, TTransformed = TData> {
	fn: () => Promise<TData>;
	key: QueryKey;
	activado?: boolean;
	transformarResultado?: (data: TData) => TTransformed;
	onError?: (error: unknown) => void;
}

const useApiQuery = <TData, TTransformed = TData>(props: IProps<TData, TTransformed>) => {
	"use no memo";
	return useQuery<TData, Error, TTransformed>({
		enabled: props.activado,
		queryKey: props.key,
		queryFn: async () => await props.fn(),
		select: props.transformarResultado,
	} as UseQueryOptions<TData, Error, TTransformed>);
};

export default useApiQuery;
