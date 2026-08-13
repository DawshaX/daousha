import { describe, expect, it } from "vitest";
import { decryptYouTubeCredential, encryptYouTubeCredential } from "./youtubeOAuth";

describe("YouTube OAuth credential protection", () => {
  it("encrypts and restores a refresh credential without exposing the plaintext", () => {
    const plaintext = "refresh-token-for-test-only";
    const ciphertext = encryptYouTubeCredential(plaintext);
    expect(ciphertext).not.toContain(plaintext);
    expect(decryptYouTubeCredential(ciphertext)).toBe(plaintext);
  });
});
