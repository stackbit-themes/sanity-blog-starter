import { SanityContentSource } from '@stackbit/cms-sanity';

export default {
    stackbitVersion: '~0.5.0',
    ssgName: 'nextjs',
    nodeVersion: '16',
    contentSources: [
        new SanityContentSource({
            projectId: process.env.SANITY_PROJECT_ID,
            rootPath: __dirname,
            studioPath: 'studio',
            token: process.env.SANITY_TOKEN
        })
    ],
    models: {
        post: { type: 'page', urlPath: '/posts/{slug}' }
    }
};
