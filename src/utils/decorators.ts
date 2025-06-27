import { HttpException, ServerError } from "./exceptions";

export function HandleErrors(customMessage?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        return await method.apply(this, args);
      } catch (error) {
        if (error instanceof HttpException) {
          throw error;
        }
        
        throw new ServerError(customMessage || "Something unexpected happened. Please try again later.");
      }
    };
  };
}