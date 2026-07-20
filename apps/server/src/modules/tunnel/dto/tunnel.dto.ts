import {
  connectInputSchema,
  downloadedConfigSchema,
  issueConfigSchema,
  revokeConfigSchema,
  tunnelConfigSchema,
} from '@gnomevpn/schemas';
import { createZodDto } from 'nestjs-zod';

export class ConnectDto extends createZodDto(connectInputSchema) {}
export class TunnelConfigDto extends createZodDto(tunnelConfigSchema) {}
export class DownloadedConfigDto extends createZodDto(downloadedConfigSchema) {}
export class IssueConfigDto extends createZodDto(issueConfigSchema) {}
export class RevokeConfigDto extends createZodDto(revokeConfigSchema) {}
