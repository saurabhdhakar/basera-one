import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';

const dom = new JSDOM('', { runScripts: 'outside-only' });
dom.window.eval(readFileSync('public/property-details.js', 'utf8'));
const details = (dom.window as unknown as { BaseraPropertyDetails: {
  model: (listing: Record<string, unknown>) => { deposit: number | null; verified: boolean; photos: string[]; amenities: { label: string; status: string }[] };
} }).BaseraPropertyDetails;

describe('property details data', () => {
  it('only shows verified status for an explicitly verified listing', () => {
    expect(details.model({ verified: true }).verified).toBe(true);
    expect(details.model({ verified: 'true' }).verified).toBe(false);
    expect(details.model({}).verified).toBe(false);
  });
  it('preserves a supplied security deposit including zero without inventing missing amounts', () => {
    expect(details.model({ securityDeposit: 12000 }).deposit).toBe(12000);
    expect(details.model({ securityDeposit: 0 }).deposit).toBe(0);
    expect(details.model({ deposit: 6000 }).deposit).toBe(6000);
    expect(details.model({}).deposit).toBeNull();
  });
  it('does not claim that unspecified amenities are available', () => {
    const items = details.model({ amenities: ['Wi-Fi', 'Power Backup'], acType: 'Non-AC Room/Flat', parking: 'No Parking' }).amenities;
    expect(items.find(x => x.label === 'Wi-Fi')?.status).toBe('Available');
    expect(items.find(x => x.label === 'Air conditioning')?.status).toBe('Not available');
    expect(items.find(x => x.label === 'Parking')?.status).toBe('Not available');
    expect(items.find(x => x.label === 'Kitchen / Food')?.status).toBe('Not specified');
  });
  it('uses only supplied safe property photo URLs', () => {
    expect(details.model({ photos: ['/assets/cats/room.png', 'javascript:alert(1)'] }).photos).toEqual(['/assets/cats/room.png']);
    expect(details.model({}).photos).toEqual([]);
  });
});