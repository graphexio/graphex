import { buildConfigType } from '@apollo-model/core';
import { AMGeoJSONCreateFieldFactory } from './create';
import { AMGeoJSONUpdateFieldFactory } from './update';
import { AMGeoJSONIntersectsFieldFactory } from './whereIntersects';
import { AMGeoJSONNearFieldFactory } from './whereNear';
import { AMGeoJSONWithinFieldFactory } from './whereWithin';

const cfg = {
  _default: {
    inputFieldFactories: {
      geoJSONCreate: {
        factory: AMGeoJSONCreateFieldFactory,
      },
      geoJSONUpdate: {
        factory: AMGeoJSONUpdateFieldFactory,
      },
      geoJSONSelectorIntersects: {
        factory: AMGeoJSONIntersectsFieldFactory,
      },
      geoJSONSelectorNear: {
        factory: AMGeoJSONNearFieldFactory,
      },
      geoJSONSelectorWithin: {
        factory: AMGeoJSONWithinFieldFactory,
      },
    },
    inputTypeFactories: {
      create: {
        dynamicLinks: {
          GeoJSONPoint: {
            fieldFactories: ['geoJSONCreate'],
          },
          GeoJSONPolygon: {
            fieldFactories: ['geoJSONCreate'],
          },
        },
      },
      update: {
        dynamicLinks: {
          GeoJSONPoint: {
            fieldFactories: ['geoJSONUpdate'],
          },
          GeoJSONPolygon: {
            fieldFactories: ['geoJSONUpdate'],
          },
        },
      },
      where: {
        dynamicLinks: {
          GeoJSONPoint: {
            selectors: [
              'geoJSONSelectorIntersects',
              'geoJSONSelectorNear',
              'geoJSONSelectorWithin',
            ],
          },
          GeoJSONPolygon: {
            selectors: [
              'geoJSONSelectorIntersects',
              'geoJSONSelectorNear',
              'geoJSONSelectorWithin',
            ],
          },
        },
      },
    },
  },
};

export const config = buildConfigType(cfg);
