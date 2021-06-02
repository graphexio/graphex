export const anonymusRole = {
  Category: {
    filter: {
      parentCategory: { title: 'root' },
    },
    delete: {
      allow: false,
    },
    update: { allow: false },
    create: { allow: false },
  },
  User: {
    delete: {
      allow: false,
    },
    update: { allow: false },
    create: { allow: false },
  },
};
