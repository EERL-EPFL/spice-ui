import { stringify } from "query-string";
import { fetchUtils, DataProvider } from "ra-core";

const convertFileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file.rawFile);
  });

const handleBinaryUpload = async (resource, params) => {
  const { data } = params;

  if (
    (resource === "plots" || resource === "soil_types") &&
    data.image &&
    data.image.rawFile instanceof File
  ) {
    data.image = await convertFileToBase64(data.image);
  }
  if (
    (resource === "gnss" ||
      resource === "instruments" ||
      resource === "sensors") &&
    data.attachments &&
    data.attachments.rawFile instanceof File
  ) {
    data.data_base64 = await convertFileToBase64(data.attachments);
    data.filename = data.attachments.title;
  }

  if (resource === "soil_profiles") {
    const imagePromises = [];

    if (data.photo && data.photo.rawFile instanceof File) {
      imagePromises.push(
        convertFileToBase64(data.photo).then((base64) => {
          data.photo = base64;
        }),
      );
    }

    if (data.soil_diagram && data.soil_diagram.rawFile instanceof File) {
      imagePromises.push(
        convertFileToBase64(data.soil_diagram).then((base64) => {
          data.soil_diagram = base64;
        }),
      );
    }

    await Promise.all(imagePromises);
  }

  return params;
};

const dataProvider = (
  apiUrl: string,
  httpClient = fetchUtils.fetchJson,
  countHeader: string = "Content-Range",
): DataProvider => ({
  getList: (resource, params) => {
    const { page, perPage } = params.pagination;
    const { field, order } = params.sort;

    const rangeStart = (page - 1) * perPage;
    const rangeEnd = page * perPage - 1;

    const query = {
      sort: JSON.stringify([field, order]),
      range: JSON.stringify([rangeStart, rangeEnd]),
      filter: JSON.stringify(params.filter),
    };
    const url = `${apiUrl}/${resource}?${stringify(query)}`;
    const options =
      countHeader === "Content-Range"
        ? {
            // Chrome doesn't return `Content-Range` header if no `Range` is provided in the request.
            headers: new Headers({
              Range: `${resource}=${rangeStart}-${rangeEnd}`,
            }),
          }
        : {};

    return httpClient(url, options).then(({ headers, json }) => {
      if (!headers.has(countHeader)) {
        throw new Error(
          `The ${countHeader} header is missing in the HTTP Response. The simple REST data provider expects responses for lists of resources to contain this header with the total number of results to build the pagination. If you are using CORS, did you declare ${countHeader} in the Access-Control-Expose-Headers header?`,
        );
      }
      return {
        data: json,
        total:
          countHeader === "Content-Range"
            ? parseInt(headers.get("content-range").split("/").pop(), 10)
            : parseInt(headers.get(countHeader.toLowerCase())),
      };
    });
  },

  getOne: (resource, params) => {
    if (params.meta) {
      // If meta params exist, pass as query strings
      const query = {
        ...params.meta,
      };
      const url = `${apiUrl}/${resource}/${params.id}?${stringify(query)}`;
      return httpClient(url).then(({ json }) => ({ data: json }));
    } else {
      return httpClient(`${apiUrl}/${resource}/${params.id}`).then(
        ({ json }) => ({ data: json }),
      );
    }
  },

  getMany: (resource, params) => {
    const query = {
      filter: JSON.stringify({ id: params.ids }),
    };
    const url = `${apiUrl}/${resource}?${stringify(query)}`;
    return httpClient(url).then(({ json }) => ({ data: json }));
  },

  getManyReference: (resource, params) => {
    const { page, perPage } = params.pagination;
    const { field, order } = params.sort;

    const rangeStart = (page - 1) * perPage;
    const rangeEnd = page * perPage - 1;

    const query = {
      sort: JSON.stringify([field, order]),
      range: JSON.stringify([(page - 1) * perPage, page * perPage - 1]),
      filter: JSON.stringify({
        ...params.filter,
        [params.target]: params.id,
      }),
    };
    const url = `${apiUrl}/${resource}?${stringify(query)}`;
    const options =
      countHeader === "Content-Range"
        ? {
            // Chrome doesn't return `Content-Range` header if no `Range` is provided in the request.
            headers: new Headers({
              Range: `${resource}=${rangeStart}-${rangeEnd}`,
            }),
          }
        : {};

    return httpClient(url, options).then(({ headers, json }) => {
      if (!headers.has(countHeader)) {
        throw new Error(
          `The ${countHeader} header is missing in the HTTP Response. The simple REST data provider expects responses for lists of resources to contain this header with the total number of results to build the pagination. If you are using CORS, did you declare ${countHeader} in the Access-Control-Expose-Headers header?`,
        );
      }
      return {
        data: json,
        total:
          countHeader === "Content-Range"
            ? parseInt(headers.get("content-range").split("/").pop(), 10)
            : parseInt(headers.get(countHeader.toLowerCase())),
      };
    });
  },

  update: async (resource, params) => {
    params = await handleBinaryUpload(resource, params);
    return httpClient(`${apiUrl}/${resource}/${params.id}`, {
      method: "PUT",
      body: JSON.stringify(params.data),
    }).then(({ json }) => ({
      data: {
        ...json,
        id: json.id || params.id, // Ensure ID is preserved
      },
    }));
  },

  // simple-rest doesn't handle provide an updateMany route, so we fallback to calling update n times instead
  updateMany: (resource, params) =>
    Promise.all(
      params.ids.map((id) =>
        httpClient(`${apiUrl}/${resource}/${id}`, {
          method: "PUT",
          body: JSON.stringify(params.data),
        }),
      ),
    ).then((responses) => ({ data: responses.map(({ json }) => json.id) })),

  create: async (resource, params) => {
    params = await handleBinaryUpload(resource, params);
    return httpClient(`${apiUrl}/${resource}`, {
      method: "POST",
      body: JSON.stringify(params.data),
    }).then(({ json }) => ({ data: json }));
  },

  delete: (resource, params) =>
    httpClient(`${apiUrl}/${resource}/${params.id}`, {
      method: "DELETE",
      headers: new Headers({
        "Content-Type": "text/plain",
      }),
    }).then(({ json }) => ({ data: json })),
  deleteMany: (resource, params) => {
    // Send a list of ids to delete
    // The API should return an array of the deleted ids
    // So that the dataProvider can update the redux store
    // and the view
    if (params.ids.length === 0) {
      return Promise.resolve({ data: [] });
    } else {
      return httpClient(`${apiUrl}/${resource}/batch`, {
        method: "DELETE",
        body: JSON.stringify(params.ids),
      }).then(({ json }) => ({ data: json }));
    }
  },
  createMany: async (resource, params) => {
    const items = params.data;
    return httpClient(`${apiUrl}/${resource}/batch`, {
      method: "POST",
      body: JSON.stringify(items),
    }).then(({ json }) => ({ data: json }));
  },
  updateManyArray: async (resource, params) => {
    const items = params.data;
    return httpClient(`${apiUrl}/${resource}/batch`, {
      method: "PUT",
      body: JSON.stringify(items),
    }).then(({ json }) => ({ data: json }));
  },
  getInstrumentRawData: async (resource, params) => {
    const url = `${apiUrl}/${resource}/${params.id}/raw`;
    return httpClient(url).then(({ json }) => ({ data: json }));
  },
  getInstrumentBaselineFilteredData: async (resource, params) => {
    const url = `${apiUrl}/${resource}/${params.id}/filtered`;
    return httpClient(url).then(({ json }) => ({ data: json }));
  },
  getInstrumentSummaryData: async (resource, params) => {
    const url = `${apiUrl}/${resource}/${params.id}/summary`;
    return httpClient(url).then(({ json }) => ({ data: json }));
  },
  deleteData: async (resource, params) => {
    const url = `${apiUrl}/${resource}/${params.id}/data`;
    return httpClient(url, {
      method: "DELETE",
    }).then(({ json }) => ({ data: json }));
  },
  processExcel: async (resource, params) => {
    const { experimentId, file } = params;
    const url = `${apiUrl}/${resource}/${experimentId}/process-excel`;

    // Create FormData for multipart upload
    const formData = new FormData();
    formData.append("file", file);

    // Use httpClient but with FormData (it will handle auth headers)
    return httpClient(url, {
      method: "POST",
      body: formData,
    }).then(({ json }) => ({ data: json }));
  },
  loadAssetImage: async (assetId: string, authToken: string) => {
    const url = `${apiUrl}/assets/${assetId}/view`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to load asset: ${response.statusText}`);
    }

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    return {
      data: {
        blobUrl,
        contentType: response.headers.get("content-type"),
      },
    };
  },
});

export default dataProvider;
