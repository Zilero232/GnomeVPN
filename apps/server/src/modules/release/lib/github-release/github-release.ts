import { z } from 'zod';

export const githubAssetSchema = z.object({
  id: z.number(),
  name: z.string(),
  size: z.number(),
  browser_download_url: z.string()
});

export const githubReleaseSchema = z.object({
  tag_name: z.string(),
  html_url: z.string(),
  body: z.string().nullable(),
  published_at: z.string().nullable(),
  assets: z.array(githubAssetSchema)
});

export const updaterManifestSchema = z.object({
  version: z.string(),
  notes: z.string(),
  pub_date: z.string().nullable(),
  platforms: z.record(
    z.string(),
    z.object({
      signature: z.string(),
      url: z.string()
    })
  )
});
