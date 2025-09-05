import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

export interface Pagination<T> {
  status: string;
  message: string | undefined;
  data: {
    results: T[];
    pagination: {
      count: number;
      next: string | null;
      previous: string | null;
    }
  }
}

interface PaginationUrls {
  next: string | null;
  previous: string | null;
}

export const buildPaginationUrls = (
  baseUrl: string,
  limit: number,
  offset: number,
  totalCount: number
): PaginationUrls => {
  
  const next = offset + limit < totalCount ?
    `${baseUrl}?limit=${limit}&offset=${offset + limit}` : null;
  
  const previous = offset > 0 ? 
    `${baseUrl}?limit=${limit}&offset=${Math.max(0, offset - limit)}` : null;

  return { next, previous };
};

export const paginate = (
  request: Request,
  response: Response,
  limit: number,
  offset: number,
  data: any
) => {
  const baseUrl = `${request.protocol}://${request.get('host')}${request.path}`;
  const { next, previous } = buildPaginationUrls(baseUrl, limit, offset, data.length);

  const paginatedResponse: Pagination<any> = {
    status: 'success',
    message: undefined,
    data: {
      results: data,
      pagination: {
        next,
        previous,
        count: data.length
      }
    }
  };

  response.status(StatusCodes.OK).json(paginatedResponse);
}
