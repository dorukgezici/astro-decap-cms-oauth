export const configYML = `
  backend:
    name: github
    repo: dorukgezici/diolea
    branch: main
    site_domain: diolea.netlify.app
    base_url: https://diolea.netlify.app
    auth_endpoint: oauth

  media_folder: public/uploads
  public_folder: /uploads

  collections:
    - name: "news" # Used in routes, e.g., /admin/collections/blog
      label: "News" # Used in the UI
      folder: "src/content/news" # The path to the folder where the documents are stored
      create: true # Allow users to create new documents in this collection
      preview_path_date_field: "date"
      slug: "{{year}}-{{month}}-{{day}}-{{slug}}" # Filename template, e.g., YYYY-MM-DD-title.md
      fields: # The fields for each document, usually in front matter
        - { label: "Source", name: "source", widget: "string" }
        - { label: "URL", name: "url", widget: "string" }
        - { label: "Featured Image", name: "img", widget: "image" }
        - { label: "Publish Date", name: "date", widget: "datetime" }
        - { label: "Title", name: "title", widget: "string" }
        - { label: "Body", name: "body", widget: "markdown" }
`;
