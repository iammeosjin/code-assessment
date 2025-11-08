export async function gotry<TData, TError = Error>(
  promise: Promise<TData>,
): Promise<[TData, null] | [null, TError]> {
  try {
    const data = await promise;

    return [data, null];
  } catch (error) {
    return [null, <TError>error];
  }
}
