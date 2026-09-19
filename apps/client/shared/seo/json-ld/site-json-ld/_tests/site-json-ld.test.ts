import { CLIENT_REGISTRY, PLANS } from '@gnomevpn/schemas';
import { describe, expect, it } from 'vitest';

import { productJsonLd, siteJsonLd } from '../site-json-ld';
import { PLATFORM_LABELS } from '../site-json-ld.constants';

const nodeOf = (type: string) => siteJsonLd['@graph'].find((entry) => entry['@type'] === type);

describe('siteJsonLd', () => {
  it('describes the organisation, the site and the app, leaving the product to the pages that sell it', () => {
    expect(siteJsonLd['@graph'].map((entry) => entry['@type'])).toEqual(['Organization', 'WebSite', 'SoftwareApplication']);
  });

  it('ties the site back to the one organisation node', () => {
    expect(nodeOf('WebSite')?.publisher).toEqual({ '@id': nodeOf('Organization')?.['@id'] });
  });

  it('ties the app back to the same organisation node', () => {
    expect(nodeOf('SoftwareApplication')?.publisher).toEqual({ '@id': nodeOf('Organization')?.['@id'] });
  });

  it('prices the app from the plans, so a repricing cannot leave it stale', () => {
    expect(nodeOf('SoftwareApplication')?.offers?.offerCount).toBe(PLANS.length);
    expect(nodeOf('SoftwareApplication')?.offers?.highPrice).toBe(Math.max(...PLANS.map((plan) => plan.priceRub)));
  });

  it('names the platforms the app actually ships on rather than a hardcoded list', () => {
    const operatingSystem = nodeOf('SoftwareApplication')?.operatingSystem ?? '';

    for (const platform of CLIENT_REGISTRY.incy.platforms) {
      expect(operatingSystem).toContain(PLATFORM_LABELS[platform]);
    }
  });
});

describe('productJsonLd', () => {
  it('prices the product from the plans, so the two cannot drift', () => {
    expect(productJsonLd.offers.offerCount).toBe(PLANS.length);
    expect(productJsonLd.offers.highPrice).toBe(Math.max(...PLANS.map((plan) => plan.priceRub)));
  });

  it('quotes both ends of the range in the same unit, or the range means nothing', () => {
    const totals = PLANS.map((plan) => plan.priceRub);

    expect(productJsonLd.offers.lowPrice).toBe(Math.min(...totals));
    expect(productJsonLd.offers.highPrice).toBe(Math.max(...totals));
    expect(productJsonLd.offers.lowPrice).toBeLessThanOrEqual(productJsonLd.offers.highPrice);
  });

  it('names every offer rather than leaving a bare month count', () => {
    for (const offer of productJsonLd.offers.offers) {
      expect(offer.name).not.toMatch(/^\d+$/);
    }
  });

  it('ties the product back to the organisation node', () => {
    expect(productJsonLd.brand).toEqual({ '@id': nodeOf('Organization')?.['@id'] });
  });
});
