import Random "mo:base/Random";
import Blob "mo:base/Blob";
import Array "mo:base/Array";
import Nat8 "mo:base/Nat8";
import Text "mo:base/Text";

module {
  public type Hash32 = Blob; // 32-byte digest

  /// Generate a random 32-byte Hash32
  public func randomHash32() : async Hash32 {
    // Random.Finite is async because it queries the IC’s system randomness
    let entropy = await Random.blob();
    // Hash it down to 32 bytes deterministically
    // or if blob is big enough, just truncate 32 bytes
    let arr = Blob.toArray(entropy);
    if (arr.size() >= 32) {
      return Blob.fromArray(Array.tabulate<Nat8>(32, func(i) { arr[i] }));
    } else {
      // fallback: expand entropy by repeating and slicing
      let buf = Array.tabulate<Nat8>(32, func(i) {
        arr[i % arr.size()]
      });
      return Blob.fromArray(buf);
    };
  };

  /// Convert a single byte to 2-char hex
  private func nat8ToHex(b : Nat8) : Text {
    let digitsArr = Text.toArray("0123456789abcdef");
    let hi = Nat8.toNat(b / 16);
    let lo = Nat8.toNat(b % 16);
    Text.fromChar(digitsArr[hi]) # Text.fromChar(digitsArr[lo])
  };

  /// Render a Hash32 digest as lowercase hex
  public func toHex(d : Hash32) : Text {
    let bytes = Blob.toArray(d);
    Array.foldLeft<Nat8, Text>(bytes, "", func(acc, b) { acc # nat8ToHex(b) })
  };
}
