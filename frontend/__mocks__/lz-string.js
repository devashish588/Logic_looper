/**
 * Pass-through mock for lz-string.
 * compress/decompress are identity functions in tests.
 */
const LZString = {
    compressToUTF16: (str) => str,
    decompressFromUTF16: (str) => str,
};

export default LZString;
