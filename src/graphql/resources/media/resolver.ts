import { FileUpload, PaginationInput, Resource } from '../../../type';
import { Media } from '../../../database/entities';
import { getResources, processUpload, returnError } from '../../../helpers/graphql';

const createMedia = async (fileName: string, fileType: string, fileUrl: string) => {
    const media = Media.create({ fileName, fileType, fileUrl });
    await media.save();
    return media;
};

const resolver = {
    Query: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getMedias: async (_: any, args: { input: PaginationInput; filter: { fileName: string; fileType: string } }): Promise<Resource<Media>> => {
            try {
                const res = (await getResources(Media, args.input, [])) as Resource<Media>;
                if (args.filter) {
                    if (args.filter.fileName) {
                        res.rows = res.rows.filter((media) => media.fileName.toLowerCase().includes(args.filter.fileName.toLowerCase()));
                    }
                    if (args.filter.fileType) {
                        res.rows = res.rows.filter((media) => media.fileType.toLowerCase().includes(args.filter.fileType.toLowerCase()));
                    }
                }
                return res;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
    },
    Mutation: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        uploadImage: async (_: any, args: { input: FileUpload }): Promise<Media> => {
            try {
                const { filename, mimetype, fileUrl } = await processUpload(args.input);
                return createMedia(filename, mimetype, fileUrl);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        uploadPdf: async (_: any, args: { input: FileUpload }): Promise<Media> => {
            try {
                const { filename, mimetype, fileUrl } = await processUpload(args.input, 'pdf');
                return createMedia(filename, mimetype, fileUrl);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
    },
};

export default resolver;
