export const fallbackPrompts = {
  "vercel/next.js": `Next.js is an open-source React framework for building modern web applications. It offers hybrid static and server-side rendering, file-system routing, API routes, TypeScript support, and optimized performance out of the box.

Propose a modular folder structure for a scalable web application using Next.js, Tailwind CSS, and API routes.

## Proposed Folder Structure:
\`\`\`
my-nextjs-app/
├── components/           # Reusable UI components
├── pages/                # Application routes
│   ├── api/             # API route handlers
│   └── _app.tsx         # Custom App component
├── public/               # Static assets
├── styles/               # Global and component styles
├── lib/                  # Utility functions and helpers
├── hooks/                # Custom React hooks
├── middleware/           # Middleware functions
├── tests/                # Unit and integration tests
├── scripts/              # Automation scripts
├── .github/              # Workflows and configs
├── .env.local            # Local environment variables
├── next.config.js        # Next.js configuration
└── tsconfig.json         # TypeScript configuration
\`\`\`

## Suggested Improvements:
- Integrate ESLint and Prettier
- Set up Jest and React Testing Library
- Add GitHub Actions workflow
- Provide advanced routing examples (dynamic, catch-all)
- Document deployment strategies (Vercel, Docker)
- Configure environment variables securely

## MVP Scaffold:
If parts are missing, scaffold this minimal Next.js project:
- pages/index.tsx with a homepage
- pages/api/hello.ts example API route
- components/Layout.tsx layout component
- styles/globals.css base styles
- next.config.js configuration file`,

  "facebook/react": `React is a declarative, component-based JavaScript library for building user interfaces. It emphasizes reusable components, hooks, and predictable state management.

Propose a modular folder structure for a component-driven single-page application including reusable hooks, context management, and best practices.

## Proposed Folder Structure:
\`\`\`
my-react-app/
├── src/
│   ├── components/       # Reusable components
│   ├── hooks/            # Custom hooks
│   ├── context/          # Context providers
│   ├── services/         # API calls and business logic
│   ├── utils/            # Helpers
│   ├── assets/           # Images and icons
│   ├── styles/           # CSS modules or styled-components
│   ├── App.tsx           # Main App component
│   ├── index.tsx         # Entry point
│   └── routes.tsx        # Route configuration
├── public/
├── tests/
├── .github/
├── .env
├── tsconfig.json
└── package.json
\`\`\`

## Suggested Improvements:
- Add Jest and React Testing Library setup
- Provide examples using Context API and Redux
- Document accessibility practices
- Configure Prettier and ESLint
- Optimize performance with memoization and code splitting

## MVP Scaffold:
- App.tsx with sample routing
- components/Button.tsx
- hooks/useFetch.ts
- tests/App.test.tsx`,

  "tensorflow/tensorflow": `TensorFlow is an end-to-end open-source platform for machine learning. It provides tools to build, train, and deploy ML models across environments.

Propose a modular folder structure for designing a machine learning training pipeline including data ingestion, preprocessing, model training, evaluation, and FastAPI for inference.

## Proposed Folder Structure:
\`\`\`
tensorflow-project/
├── data/                 # Input datasets
├── notebooks/            # Jupyter notebooks
├── src/
│   ├── data_pipeline/   # Data preprocessing
│   ├── models/          # Model definitions
│   ├── training/        # Training scripts
│   ├── evaluation/      # Metrics and evaluation
│   ├── inference/       # Model serving with FastAPI
│   └── utils/           # Helpers and utilities
├── tests/
├── docker/
├── scripts/
├── config/
├── .github/
└── README.md
\`\`\`

## Suggested Improvements:
- Add MLflow for experiment tracking
- Include GPU configuration examples
- Provide Docker and Kubernetes deployment guides
- Document FastAPI serving workflows

## MVP Scaffold:
- models/model.py with sample CNN
- training/train.py
- inference/app.py FastAPI API`,

  "sindresorhus/awesome": `Awesome is a curated list of high-quality resources maintained as Markdown.

Propose a modular folder structure for transforming the markdown list into a categorized, searchable, and filterable interactive UI.

## Proposed Folder Structure:
\`\`\`
awesome-project/
├── src/
│   ├── data/             # Parsed markdown content
│   ├── components/       # UI components
│   ├── pages/            # Next.js or SPA routes
│   ├── styles/           # Styling
│   └── utils/            # Helpers
├── public/
├── scripts/              # Automation scripts
├── tests/
├── .github/
└── README.md
\`\`\`

## Suggested Improvements:
- Add full-text search
- Provide bookmarking functionality
- Support dark mode
- Include contribution guidelines

## MVP Scaffold:
- components/CategoryList.tsx
- pages/index.tsx
- utils/parseMarkdown.ts`,

  "laravel/laravel": `Laravel is a PHP framework for building web applications and APIs with expressive syntax.

Propose a modular folder structure for a REST API backend including authentication, middleware, services, configuration management, and automated testing.

## Proposed Folder Structure:
\`\`\`
laravel-app/
├── app/
│   ├── Http/
│   ├── Models/
│   ├── Providers/
│   ├── Services/
│   └── Policies/
├── routes/
│   ├── web.php
│   └── api.php
├── resources/
│   ├── views/
│   ├── js/
│   └── sass/
├── tests/
├── database/
│   ├── migrations/
│   ├── factories/
│   └── seeders/
├── public/
├── config/
├── storage/
├── .github/
└── README.md
\`\`\`

## Suggested Improvements:
- Add Docker setup
- Document API authentication (Passport/Sanctum)
- Provide CI/CD workflows
- Include API documentation generation (Swagger)

## MVP Scaffold:
- routes/api.php with sample routes
- Http/Controllers/ExampleController.php
- tests/Feature/ExampleTest.php`,

  "kubernetes/kubernetes": `Kubernetes is a container orchestration system for automating deployment, scaling, and management of applications.

Propose a modular folder structure for simulating clusters locally using Minikube, including manifests, Helm charts, configuration files, and a basic dashboard scaffold.

## Proposed Folder Structure:
\`\`\`
kubernetes-project/
├── manifests/            # Deployment, Service, ConfigMap YAMLs
├── charts/               # Helm charts
├── scripts/              # Automation scripts
├── monitoring/           # Prometheus, Grafana configs
├── dashboards/           # Dashboard configurations
├── docs/                 # Documentation
├── .github/              # Workflows
└── README.md
\`\`\`

## Suggested Improvements:
- Add Minikube setup examples
- Provide Helm chart templates
- Include RBAC and security policies
- Document monitoring setup

## MVP Scaffold:
- manifests/deployment.yaml
- charts/sample-chart/
- scripts/setup-minikube.sh`
};
