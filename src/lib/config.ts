/** Base path esplicito per fetch() e asset pubblici (Next Link lo gestisce da solo). */
export const BASE_PATH = '/evolve';
export const apiUrl = (path: string) => `${BASE_PATH}${path.startsWith('/') ? path : '/' + path}`;
