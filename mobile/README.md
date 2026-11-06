# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

## MediTrack demo data and backend readiness

The app falls back to fictional in-memory demo data from `src/data/demo-medication-repository.ts` when public Supabase settings are absent. Demo changes reset when the app process reloads. Optional Supabase Auth/data and Expo Notifications clients are prepared, but no remote project, EAS project ID, database, or push credentials are configured in this checkout.

Screens use the shared `useAppState()` provider and asynchronous `MedicationRepository` interface. The demo and Supabase repositories implement that contract. The shared schema is `profiles`, `medicines`, `dose_records`, `caregiver_access`, `device_push_tokens`, `notification_preferences`, `notification_events`, and `notification_delivery_logs`; medicine schedule/reminder arrays retain the current website/mobile data shape.

Configure the project and apply the reviewed migration/RLS policies by following [the shared setup guide](../SUPABASE_SETUP.md). Only the project URL and publishable key belong in client configuration. Never include a `service_role` or other secret key in this app. Keep demo records fictional and do not migrate them as patient records.

You can start developing by editing the files inside the **src/app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **example** directory and create a blank **src/app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
