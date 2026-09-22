/** public/ 아래 정적 파일 경로. 정적 빌드(base ./)와 개발 서버(base /) 모두에서 동작 */
export const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path}`;
export const photo = (name: string) => `photos/${name}.jpg`;
