import {
  convertSearchCriteria,
  ApiType,
} from "../../src/helpers/searchConverter";
import {
  SearchFilterType,
  EqualsFilter,
  RangeFilter,
  MultiFilter,
  EqualsAnyFilter,
} from "@shopware-pwa/commons/interfaces/search/SearchFilter";
import { PaginationLimit } from "@shopware-pwa/commons/interfaces/search/Pagination";
import { config, setup, update } from "@shopware-pwa/shopware-6-client";

describe("SearchConverter - convertSearchCriteria", () => {
  beforeEach(() => {
    setup();
  });
  describe("pagination", () => {
    it("should use p param for pagination if apiType is set to 'store'", () => {
      const config = {
        defaultPaginationLimit: 10,
      };
      const result = convertSearchCriteria({
        searchCriteria: {
          pagination: { page: PaginationLimit.ONE },
        },
        apiType: ApiType.store,
        config,
      });
      expect(result?.p).toEqual(1);
      expect(result?.limit).toEqual(config.defaultPaginationLimit);
    });
    it("should have page number with default limit if not provided", () => {
      const result = convertSearchCriteria({
        searchCriteria: { pagination: { page: PaginationLimit.ONE } },
        config,
      });
      expect(result?.page).toEqual(1);
      expect(result?.limit).toEqual(config.defaultPaginationLimit);
    });
    it("should have page number", () => {
      const result = convertSearchCriteria({
        searchCriteria: { pagination: { limit: 5 } },
        config,
      });
      expect(result?.limit).toEqual(5);
    });
    it("should have default limit if provided is out of range", () => {
      const result = convertSearchCriteria({
        searchCriteria: { pagination: { limit: 7 } },
        config,
      });
      expect(result).toStrictEqual({ limit: 10 });
    });
    it("should not add pagination for an empty object", () => {
      const result = convertSearchCriteria({
        searchCriteria: { pagination: {} },
        config,
      });
      expect(result).not.toHaveProperty("page");
    });
    it("should have full pagination info", () => {
      const result = convertSearchCriteria({
        searchCriteria: {
          pagination: {
            page: 3,
            limit: 5,
          },
        },
        config,
      });
      expect(result?.page).toEqual(3);
      expect(result?.limit).toEqual(5);
    });
    it("should change default pagination limit", () => {
      update({ defaultPaginationLimit: 50 });
      const result = convertSearchCriteria({
        searchCriteria: {
          pagination: { page: PaginationLimit.ONE },
        },
        config,
      });
      expect(result?.page).toEqual(1);
      expect(result?.limit).toEqual(50);
    });
  });
  describe("sorting", () => {
    it("should have pagination and sort params in specific format if apiType is set to 'store'", () => {
      const paramsObject = convertSearchCriteria({
        searchCriteria: {
          pagination: { page: 1 },
          sort: {
            desc: true,
            field: "name",
          },
          filters: [],
        },
        apiType: ApiType.store,
        config,
      });
      expect(paramsObject?.p).toEqual(1);
      expect(paramsObject?.limit).toEqual(config.defaultPaginationLimit);
      expect(paramsObject?.sort).toEqual("name-desc");
    });
    it("should have sorting param in specific format if apiType is set to 'store' - default ascending", () => {
      const paramsObject = convertSearchCriteria({
        searchCriteria: {
          sort: {
            field: "name",
          },
          filters: [],
        },
        apiType: ApiType.store,
        config,
      });
      expect(paramsObject?.sort).toEqual("name-asc");
    });
    it("should have pagination and sort params", () => {
      const paramsObject = convertSearchCriteria({
        searchCriteria: {
          pagination: { page: 1 },
          sort: {
            field: "name",
          },
          filters: [],
        },
        config,
      });
      expect(paramsObject?.page).toEqual(1);
      expect(paramsObject?.limit).toEqual(config.defaultPaginationLimit);
      expect(paramsObject?.sort).toEqual("name");
    });
    it("should add prefix when desc sort", () => {
      const result = convertSearchCriteria({
        searchCriteria: {
          sort: {
            field: "name",
            desc: true,
          },
        },
        config,
      });
      expect(result?.sort).toEqual("-name");
    });
  });
  describe("filters", () => {
    describe("EQUALS filters", () => {
      it("should filter by name", () => {
        const nameFilter: EqualsFilter = {
          type: SearchFilterType.EQUALS,
          field: "name",
          value: "Aerodynamic Iron Jetsilk",
        };
        const result = convertSearchCriteria({
          searchCriteria: {
            filters: [nameFilter],
          },
          config,
        });
        expect(result?.filter?.[0]).toEqual({
          type: "equals",
          value: "Aerodynamic Iron Jetsilk",
          field: "name",
        });
      });
    });
    describe("RANGE filters", () => {
      it("should filter by range", () => {
        const nameFilter: RangeFilter = {
          type: SearchFilterType.RANGE,
          field: "price",
          parameters: {
            lt: 120,
            gte: 5,
          },
        };
        const result = convertSearchCriteria({
          searchCriteria: {
            filters: [nameFilter],
          },
          config,
        });
        expect(result?.filter?.[0]).toEqual({
          type: "range",
          field: "price",
          parameters: {
            lt: 120,
            gte: 5,
          },
        });
      });
    });
    describe("MULTI filters", () => {
      it("should have multifilter for products with name A or B and price gte 0 lte 200", () => {
        const nameFilter: EqualsFilter = {
          type: SearchFilterType.EQUALS,
          field: "name",
          value: "Aerodynamic Iron Jetsilk",
        };
        const otherNameFilter: EqualsFilter = {
          type: SearchFilterType.EQUALS,
          field: "name",
          value: "Rustic Copper Jimbies",
        };
        const priceFilter: RangeFilter = {
          type: SearchFilterType.RANGE,
          field: "price",
          parameters: {
            gte: 0,
            lte: 200,
          },
        };
        const oneFromNameFilter: MultiFilter = {
          type: SearchFilterType.MULTI,
          operator: "OR",
          queries: [nameFilter, otherNameFilter],
        };
        const priceAndNamesFilter: MultiFilter = {
          type: SearchFilterType.MULTI,
          operator: "AND",
          queries: [priceFilter, oneFromNameFilter],
        };
        const result = convertSearchCriteria({
          searchCriteria: {
            filters: [priceAndNamesFilter],
          },
          config,
        });
        expect(result?.filter).toEqual([
          {
            type: "multi",
            operator: "AND",
            queries: [
              {
                type: "range",
                field: "price",
                parameters: {
                  gte: 0,
                  lte: 200,
                },
              },

              {
                type: "multi",
                operator: "OR",
                queries: [
                  {
                    type: "equals",
                    value: "Aerodynamic Iron Jetsilk",
                    field: "name",
                  },

                  {
                    type: "equals",
                    value: "Rustic Copper Jimbies",
                    field: "name",
                  },
                ],
              },
            ],
          },
        ]);
      });
    });
    describe("store-api filters", () => {
      it("should have properties property", () => {
        const nameFilter: EqualsAnyFilter = {
          type: SearchFilterType.EQUALS_ANY,
          field: "manufacturerId",
          value: ["shopware"],
        };

        const result = convertSearchCriteria({
          searchCriteria: {
            filters: [nameFilter],
          },
          apiType: ApiType.store,
          config,
        });
        expect(result).toStrictEqual({
          limit: 10,
          manufacturer: "shopware",
        });
      });
    });
  });
  describe("term", () => {
    it("should add a term key and proper value", () => {
      const result = convertSearchCriteria({
        searchCriteria: {
          term: "fulltext",
        },
        config,
      });
      expect(result.term).toEqual("fulltext");
    });
    it("should not add a term key if provided term is null", () => {
      const result = convertSearchCriteria({
        searchCriteria: {
          term: null,
        },
        config,
      } as any);
      expect(result).not.toHaveProperty("term");
    });
  });
  describe("configuration", () => {
    describe("displayParents", () => {
      it("should not return displayGroup grouped parameter and appropriate filter when displayParents switch is on", () => {
        const result = convertSearchCriteria({
          searchCriteria: {
            filters: {},
            configuration: {
              displayParents: true,
            },
          },
          config,
        } as any);
        expect(result).toEqual({ limit: 10 });
      });
      it("should return displayGroup grouped parameter and appropriate filter by default", () => {
        const result = convertSearchCriteria({
          searchCriteria: {
            filters: [
              {
                type: "equals",
                field: "name",
                value: "test",
              } as any,
            ],
            sort: {
              field: "name",
              desc: true,
            },
          },
          config,
        });
        expect(result).toEqual({
          filter: [
            {
              field: "name",
              type: "equals",
              value: "test",
            },
          ],
          sort: "-name",
          limit: 10,
        });
      });
    });
    describe("grouping", () => {
      it("should return grouped field", () => {
        const result = convertSearchCriteria({
          searchCriteria: {
            configuration: {
              grouping: {
                field: "displayGroup",
              },
            },
          },
          config,
        });
        expect(result?.grouping).toEqual({ field: "displayGroup" });
      });
    });
    describe("associations", () => {
      it("should return association", () => {
        const result = convertSearchCriteria({
          searchCriteria: {
            configuration: {
              associations: [
                {
                  name: "media",
                },
              ],
            },
          },
          config,
        });
        expect(result?.associations).toEqual({ media: {} });
      });

      it("should not add associations on empty array", () => {
        const result = convertSearchCriteria({
          searchCriteria: {
            configuration: {
              associations: [],
            },
          },
          config,
        });
        expect(result).toHaveProperty("associations");
      });

      it("should return multiple associations", () => {
        const result = convertSearchCriteria({
          searchCriteria: {
            configuration: {
              associations: [
                {
                  name: "media",
                  associations: [
                    {
                      name: "cover",
                    },
                  ],
                },
                {
                  name: "stock",
                },
              ],
            },
          },
          config,
        });
        expect(result?.associations).toEqual({
          media: { associations: { cover: {} } },
          stock: {},
        });
      });

      it("should return deep association", () => {
        const result = convertSearchCriteria({
          searchCriteria: {
            configuration: {
              associations: [
                {
                  name: "cmsPage",
                  associations: [
                    {
                      name: "sections",
                      associations: [
                        { name: "blocks", associations: [{ name: "slots" }] },
                      ],
                    },
                  ],
                },
              ],
            },
          },
          config,
        });
        expect(result?.associations).toEqual({
          cmsPage: {
            associations: {
              sections: {
                associations: {
                  blocks: {
                    associations: {
                      slots: {},
                    },
                  },
                },
              },
            },
          },
        });
      });
    });
  });
});
