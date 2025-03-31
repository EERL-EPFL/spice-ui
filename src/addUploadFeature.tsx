// This allows instrument data to be uploaded as base64 strings
import { fetchUtils } from 'ra-core';

const addUploadCapabilities = dataProvider => ({
    ...dataProvider,
    update: (resource, params) => {
        if (resource === 'sensors') {
            // data field.
            // A new data file is an updated version of the existing file.
            // and are converted to base64 strings to be unwrapped and stored
            // in the DB

            if (!params.data.instrumentdata) {
                return dataProvider.update(resource, params);
            }
            const newInstrumentData = params.data.instrumentdata.filter(
                p => p.rawFile instanceof File
            );

            return Promise.all(newInstrumentData.map(convertFileToBase64))
                .then(base64InstrumentData =>
                    base64InstrumentData.map(instrumentdata64 => ({
                        src: instrumentdata64,
                        title: `${params.data.title}`,
                    }))
                )
                .then(transformedNewInstrumentData =>
                    dataProvider.update(resource, {
                        ...params,
                        data: {
                            id: params.data.id,
                            name: params.data.name,
                            description: params.data.description,
                            geom: params.data.geom,
                            area_id: params.data.area_id,
                            latitude: params.data.latitude,
                            longitude: params.data.longitude,
                            instrumentdata: transformedNewInstrumentData[0].src,
                        },
                    })
                );

        } else {
            // fallback to the default implementation
            return dataProvider.update(resource, params);
            // The sensors update uses a file upload widget for the instrument

        }
    },
    // else if sensor and a create operation, then the instrument data is
    // a .gpx file, which is converted to a base64 string and stored in the
    // gps field
    createMany: (resource, params) => {
        if (resource === 'sensors') {
            const gpsData = params.data.gpx.filter(
                p => p.rawFile instanceof File
            );
            return Promise.all(gpsData.map(convertFileToBase64))
                .then(base64GPSData =>
                    base64GPSData.map(gps64Data => ({
                        src: gps64Data,
                        title: `${params.data.title}`,
                    }))
                )
                .then(transformedGPSData =>
                    fetchUtils.fetchJson(
                        `${dataProvider.apiUrl}/sensors/many`, {
                        method: 'POST',
                        body: JSON.stringify({
                            area_id: params.data.area_id,
                            gpsx_files: [
                                ...transformedGPSData
                            ],
                        })
                    })).then(
                        responses => (
                            { data: responses.map(({ json }) => json.id) }
                        )
                    );
        } else {
            for (let i = 0; i < params.data.length; i++) {
                dataProvider.create(resource, params.data[i]);
            }
        }
    }
});


/**
 * Convert a `File` object returned by the upload input into a base 64 string.
 * That's not the most optimized way to store images in production, but it's
 * enough to illustrate the idea of data provider decoration.
 */
const convertFileToBase64 = file =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file.rawFile);

        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
    });

export default addUploadCapabilities;
