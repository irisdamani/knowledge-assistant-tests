import { ApiResponse, BaseApiClient } from '../base.api.service';
import { DocumentDto, Region } from './dto/document.dto';
import { QueryRequestDto, QueryResponseDto, Role } from './dto/query.dto';
import { KnowledgeEndpoints } from './endpoints.enum';

export class KnowledgeApiService extends BaseApiClient {
  private userHeaders(region: Region | string, role: Role | string): Record<string, string> {
    return {
      'X-User-Region': region,
      'X-User-Role': role,
    };
  }

  public async query(
    region: Region | string,
    role: Role | string,
    question: string,
  ): Promise<ApiResponse<QueryResponseDto>> {
    return this.post<QueryResponseDto>(KnowledgeEndpoints.Query, {
      headers: this.userHeaders(region, role),
      data: { question } satisfies QueryRequestDto,
    });
  }

  public async documents(
    region: Region | string,
    role: Role | string,
  ): Promise<ApiResponse<DocumentDto[]>> {
    return this.get<DocumentDto[]>(KnowledgeEndpoints.Documents, {
      headers: this.userHeaders(region, role),
    });
  }

  public async queryRaw(
    headers: Record<string, string>,
    question: string,
  ): Promise<ApiResponse<unknown>> {
    return this.post<unknown>(KnowledgeEndpoints.Query, {
      headers,
      data: { question },
    });
  }

  public async documentsRaw(
    headers: Record<string, string>,
  ): Promise<ApiResponse<unknown>> {
    return this.get<unknown>(KnowledgeEndpoints.Documents, { headers });
  }
}
