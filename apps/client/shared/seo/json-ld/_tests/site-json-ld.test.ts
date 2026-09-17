import { PLANS } from '@gnomevpn/schemas';
import { describe, expect, it } from 'vitest';

import { siteJsonLd } from '../site-json-ld';

const nodeOf = (type: string) => siteJsonLd['@graph'].find((entry) => entry['@type'] === type);

describe('siteJsonLd', () => {
  it('describes the organisation, the site and the product', () => {
    expect(siteJsonLd['@graph'].map((entry) => entry['@type'])).toEqual(['Organization', 'WebSite', 'Product']);
  });

  it('prices the product from the plans, so the two cannot drift', () => {
    const offers = nodeOf('Product')?.offers;

    expect(offers?.offerCount).toBe(PLANS.length);
    expect(offers?.highPrice).toBe(Math.max(...PLANS.map((plan) => plan.priceRub)));
  });

  it('ties the product and the site back to the one organisation node', () => {
    const organisationId = nodeOf('Organization')?.['@id'];

    expect(nodeOf('Product')?.brand).toEqual({ '@id': organisationId });
    expect(nodeOf('WebSite')?.publisher).toEqual({ '@id': organisationId });
  });
});
