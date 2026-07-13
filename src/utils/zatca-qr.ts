/**
 * ZATCA (Zakat, Tax and Customs Authority) compliant QR code generator
 * for Saudi Arabia e-invoicing (Phase 1 - Simplified Tax Invoice).
 *
 * The QR content is a Base64 string of TLV (Tag-Length-Value) encoded data:
 *   Tag 1: Seller name
 *   Tag 2: VAT registration number of the seller
 *   Tag 3: Invoice timestamp (ISO 8601)
 *   Tag 4: Invoice total (with VAT)
 *   Tag 5: VAT total
 *
 * Standard ZATCA scanner apps (and generic QR readers) decode this format
 * and show the proper structured invoice details.
 */

export interface ZatcaInvoiceData {
  sellerName: string;
  vatRegistrationNumber: string;
  /** ISO 8601 timestamp, e.g. new Date().toISOString() */
  invoiceTimestamp: string;
  /** Total including VAT, e.g. "1150.00" */
  invoiceTotal: string;
  /** VAT amount, e.g. "150.00" */
  vatAmount: string;
}

/**
 * Encode a single TLV field: [tag (1 byte)][length (1 byte)][UTF-8 value bytes]
 */
function encodeTLV(tag: number, value: string): Uint8Array {
  const valueBytes = new TextEncoder().encode(value);
  if (valueBytes.length > 255) {
    // ZATCA TLV length field is a single byte; truncate defensively
    const truncated = valueBytes.slice(0, 255);
    const tlv = new Uint8Array(2 + truncated.length);
    tlv[0] = tag;
    tlv[1] = truncated.length;
    tlv.set(truncated, 2);
    return tlv;
  }
  const tlv = new Uint8Array(2 + valueBytes.length);
  tlv[0] = tag;
  tlv[1] = valueBytes.length;
  tlv.set(valueBytes, 2);
  return tlv;
}

/**
 * Build the Base64 TLV payload for the ZATCA QR code.
 */
export function generateZatcaQRPayload(data: ZatcaInvoiceData): string {
  const fields = [
    encodeTLV(1, data.sellerName),
    encodeTLV(2, data.vatRegistrationNumber),
    encodeTLV(3, data.invoiceTimestamp),
    encodeTLV(4, data.invoiceTotal),
    encodeTLV(5, data.vatAmount),
  ];

  // Concatenate all TLV fields into one byte array
  const totalLength = fields.reduce((sum, f) => sum + f.length, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  for (const field of fields) {
    combined.set(field, offset);
    offset += field.length;
  }

  // Base64 encode the raw bytes (binary-safe)
  let binary = "";
  for (let i = 0; i < combined.length; i++) {
    binary += String.fromCharCode(combined[i]);
  }
  return btoa(binary);
}
