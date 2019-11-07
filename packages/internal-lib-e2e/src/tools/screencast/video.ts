import videoshow from 'videoshow';
import { imageSize } from 'image-size';
import { readdirSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { directories } from '../protractor.helpers';

export class VideoGenerator {
    private static baseDir = join(directories.htmlReport, 'videos');
    //joining path of directory
    private static videoOptions = {
        fps: 25,
        loop: 0.2,
        transition: false,
        videoBitrate: 8096,
        videoCodec: 'libx264',
        size: '1920x?',
        format: 'mp4',
        pixelFormat: 'yuv420p'
    };

    private static removeOddImageSize (imageSources: string[]): string[] {
        const srcSortedByDimension: Record<string, string[]> = {};
        imageSources.forEach((imageSrc: string) => {
            const size = imageSize(imageSrc);
            const dimension = `${size.width}x${size.height}`;
            // Add or reuse array
            srcSortedByDimension[dimension] = srcSortedByDimension[dimension] || [];
            // Push src to collection
            srcSortedByDimension[dimension].push(imageSrc);
        });

        // Check which collection is the biggest and return it
        return Object.keys(srcSortedByDimension).reduce((biggestCollection: string[], dimension: string) => {
            if (srcSortedByDimension[dimension].length > biggestCollection.length) {
                biggestCollection = srcSortedByDimension[dimension];
            }
            return biggestCollection;
        }, []);
    }

    public static generate (sourceFolder: string, name: string): Promise<void> {
        if (!existsSync(this.baseDir)) {
            try {
                mkdirSync(this.baseDir, { recursive: true });
            } catch (err) {
                if (err.code !== 'EEXIST') {
                    console.error('Could not create output dir: ', this.baseDir, 'Error:', err);
                }
            }
        }

        return new Promise((resolve, reject) => {
            //passsing directoryPath and callback function
            const sourceImages = readdirSync(sourceFolder)
                .filter(imageName => imageName.indexOf('jpg') !== -1)
                .map(imageName => join(sourceFolder, imageName));

            const filteredImages = this.removeOddImageSize(sourceImages);

            // console.log('Processing images:', sourceImages);

            if (!filteredImages) {
                // console.log('No images provided.');
                return;
            }

            videoshow(filteredImages, this.videoOptions)
                .save(join(this.baseDir, `${name}.mp4`))
                .on('start', function (_command) {
                    console.log(`Rendering ${name}`); // tslint:disable-line no-console
                })
                .on('error', function (err, _stdout, stderr) {
                    console.error('Error:', err);
                    console.error('ffmpeg stderr:', stderr);
                    console.log(`Rendering ERROR ${name}`); // tslint:disable-line no-console
                    reject(err);
                })
                .on('end', function (output) {
                    console.log(`Rendering COMPLETE ${name}`); // tslint:disable-line no-console
                    resolve(output);
                });
        });
    }
}

