export function slugify(str) {
    if (!str) return

    return str
        .normalize('NFD')                    // Split combined letters (e.g., "ê" -> "e" + "^")
        .replace(/[\u0300-\u036f]/g, '')     // Strip all accent marks
        .replace(/đ/g, 'd')                  // Convert lowercase 'đ' -> 'd'
        .replace(/Đ/g, 'd')                  // Convert uppercase 'Đ' -> 'd'
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9 -]/g, '')         // Remove punctuation
        .replace(/\s+/g, '-')                // Replace spaces with hyphens
        .replace(/-+/g, '-')                 // Replace multiple hyphens with single hyphen
}
