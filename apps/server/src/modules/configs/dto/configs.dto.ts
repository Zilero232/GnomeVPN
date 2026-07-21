import { downloadedConfigSchema, issueConfigSchema, revokeConfigSchema } from '@gnomevpn/schemas';
import { createZodDto } from 'nestjs-zod';

export class DownloadedConfigDto extends createZodDto(downloadedConfigSchema) {}
export class IssueConfigDto extends createZodDto(issueConfigSchema) {}
export class RevokeConfigDto extends createZodDto(revokeConfigSchema) {}
