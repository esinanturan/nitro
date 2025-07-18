---
toc_max_heading_level: 3
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Using Nitro in your app

While most libraries are built with Nitro and shipped over npm, you can also easily build a library with Nitro in your app - that's the "brownfield" way of doing things.

## Installing Nitro

First, you need to install the Nitro Modules core package from npm:

<Tabs groupId="package-manager">
  <TabItem value="npm" label="npm" default>
    ```sh
    npm i react-native-nitro-modules
    cd ios && pod install
    ```
  </TabItem>
  <TabItem value="yarn" label="yarn">
    ```sh
    yarn add react-native-nitro-modules
    cd ios && pod install
    ```
  </TabItem>
  <TabItem value="pnpm" label="pnpm">
    ```sh
    pnpm add react-native-nitro-modules
    cd ios && pod install
    ```
  </TabItem>
  <TabItem value="bun" label="bun">
    ```sh
    bun i react-native-nitro-modules
    cd ios && pod install
    ```
  </TabItem>
</Tabs>

## Creating a Hybrid Object

After installing Nitro, you can start creating your [Hybrid Objects](hybrid-objects) - either with [Nitrogen](nitrogen), or manually:

<Tabs groupId="nitrogen-or-not">
  <TabItem value="nitrogen" label="With Nitrogen ✨" default>

  Nitrogen will ✨ automagically ✨ generate native specifications for each Hybrid Object based on a given TypeScript definition.

  ### 1. Installing Nitrogen

  First, install Nitrogen:

  <Tabs groupId="package-manager">
    <TabItem value="npm" label="npm" default>
      ```sh
      npm i nitro-codegen --save-dev
      ```
    </TabItem>
    <TabItem value="yarn" label="yarn">
      ```sh
      yarn add nitro-codegen -D
      ```
    </TabItem>
    <TabItem value="pnpm" label="pnpm">
      ```sh
      pnpm add nitro-codegen -D
      ```
    </TabItem>
    <TabItem value="bun" label="bun">
      ```sh
      bun i nitro-codegen -d
      ```
    </TabItem>
  </Tabs>

  :::warning
  Nitrogen is currently named `nitro-codegen` instead of `nitrogen` on npm.
  :::

  Then, create your `nitro.json` configuration in your app's root directory:

  ```json
  {
    "$schema": "https://nitro.margelo.com/nitro.schema.json",
    "cxxNamespace": ["example"],
    "ios": {
      "iosModuleName": "NitroExample"
    },
    "android": {
      "androidNamespace": ["example"],
      "androidCxxLibName": "NitroExample"
    },
    "autolinking": {}
  }
  ```

  Note: Replace `Example` with your app's name.

  ### 2. Creating Nitro specs

  Now it's time to create your first spec. Let's create `Math.nitro.ts`:

  ```ts title="Math.nitro.ts"
  interface Math extends HybridObject<{ ios: 'swift', android: 'kotlin' }> {
    readonly pi: number
    add(a: number, b: number): number
  }
  ```

  And now let's run Nitrogen:

  ```sh
  npx nitro-codegen
  ```

  :::warning
  Nitrogen is currently named `nitro-codegen` instead of `nitrogen` on npm.
  :::

  This will generate the native Swift and Kotlin protocol "`HybridMathSpec`", as well as some helper classes for autolinking and bridging to C++.

  ### 3. Adding the generated sources to your project

  You now need to add the generated sources to your project - either by creating a sub-package that you will use in your app (e.g. in a monorepo), or by just manually adding the source files:

  <Tabs>
    <TabItem value="manually" label="Manually">

      #### iOS

      On iOS, you just need to drag and drop the `nitrogen/generated/ios` and `nitrogen/generated/shared` folders into your Xcode project. That's it.

      #### Android

      For Android, you need to add everything in `nitrogen/generated/android` and `nitrogen/generated/shared` to your build.gradle (Java/Kotlin source) and CMake (C++ sources) project.

      ##### Java/Kotlin sources (`build.gradle`)

      Add the Java/Kotlin sources to your Gradle project by including the generated autolinking gradle file. Simply add this to the top of your `app/build.gradle`:

      ```groovy
      apply from: '../nitrogen/generated/android/NitroExample+autolinking.gradle'
      ```

      ##### C++ sources (`CMakeLists.txt`)

      Add the C++ sources to your CMake project by including the generated autolinking CMake file. If you do not have a CMake setup yet, make sure to configure CMake through `externalNativeBuild` in `build.gradle`. Simply add this to your `CMakeLists.txt`:

      ```cmake
      include(${CMAKE_SOURCE_DIR}/../nitrogen/generated/android/NitroTest+autolinking.cmake)
      ```

    </TabItem>
    <TabItem value="subpackage" label="Via a subpackage">

      #### iOS

      On iOS, you need to create a local Podspec (`$$iosModuleName$$.podspec`). In this local pod you need to include the autolinking code that has been generated by Nitrogen:
      ```ruby
      load 'nitrogen/generated/ios/NitroExample+autolinking.rb'
      add_nitrogen_files(s)
      ```
      And then just add this local Pod to your `Podfile`:
      ```ruby
      pod '$$iosModuleName$$', :path => '../'
      ```

      #### Android

      On Android, you need to create a local Android library (`build.gradle`). This library also needs to set up a CMake build (via `externalNativeBuild`). See the template for an example.

      Inside the local Android library's `build.gradle`, add the autogenerated Java/Kotlin sources:

      ```groovy
      apply from: '../nitrogen/generated/android/NitroExample+autolinking.gradle'
      ```

      Inside the local Android library's `CMakeLists.txt`, add the autogenerated C++ sources:

      ```cmake
      include(${CMAKE_SOURCE_DIR}/../nitrogen/generated/android/NitroTest+autolinking.cmake)
      ```

      And lastly, add this local Android library to your app's `build.gradle` using `dependencies`:

      ```groovy
      // ...
      dependencies {
        // ...
        implementation project(':your-local-library')
      }
      ```

      You might also need to include the local library in your app's `settings.gradle`:

      ```groovy
      include ':your-local-library'
      ```

    </TabItem>
  </Tabs>

  ### 4. Implement Hybrid Object Specs

  After adding the generated sources to your project, you can start implementing the spec in a class:

  <Tabs groupId="native-language">
    <TabItem value="swift" label="Swift" default>
      ```swift title="HybridMath.swift"
      class HybridMath : HybridMathSpec {
        public var pi: Double {
          return Double.pi
        }
        public func add(a: Double, b: Double) throws -> Double {
          return a + b
        }
      }
      ```
    </TabItem>
    <TabItem value="kotlin" label="Kotlin">
      ```kotlin title="HybridMath.kt"
      class HybridMath : HybridMathSpec() {
        override var pi: Double
          get() = Double.PI

        override fun add(a: Double, b: Double): Double {
          return a + b
        }
      }
      ```
    </TabItem>
  </Tabs>

  ### 5. Registering the Hybrid Objects

  Nitro needs to be able to initialize an instance of your Hybrid Object - so we need to tell it how to do that.
  In your `nitro.json`, register `HybridMath` in the `"autolinking"` section:
  <Tabs>
    <TabItem value="swift-kotlin" label="Swift/Kotlin" default>
      ```json
      {
        ...
        "autolinking": {
          "Math": {
            "swift": "HybridMath",
            "kotlin": "HybridMath"
          }
        }
      }
      ```

      :::warning
      - Make sure `HybridMath` is default-constructible. That is, it has a public initializer that takes no arguments.
      - Make sure the Java/Kotlin class `HybridMath` is inside the package/namespace `com.margelo.nitro.$$androidNamespace$$` (as configured in `nitro.json`).
      - Make sure the Java/Kotlin class `HybridMath` is annotated with `@DoNotStrip` to avoid it from being compiled out in production builds.
      :::
    </TabItem>
    <TabItem value="cpp" label="C++">
      ```json
      {
        ...
        "autolinking": {
          "Math": {
            "cpp": "HybridMath"
          }
        }
      }
      ```

      :::warning
      - Make sure `HybridMath` is default-constructible. That is, it has a public constructor that takes no arguments.
      - Make sure the `HybridMath` class is defined in a header named `HybridMath.hpp` - this is what Nitro will import.
      - Also make sure `HybridMath` is either in the global namespace, or in `margelo::nitro::<cxxNamespace>` (configured in `nitro.json`).
      :::
    </TabItem>
  </Tabs>

  For more information, see the [Nitrogen documentation](nitrogen).

  </TabItem>
  <TabItem value="manually" label="Manually">

  Manually creating Hybrid Objects is quite easy, but since Nitro is a C++ library, you need to use C++.
  You can bridge the implementations of those methods to Swift/Objective-C/Java/Kotlin/Rust yourself, but Nitrogen usually does all of that ✨ automagically ✨.

  Simply create your C++ classes and inherit from `HybridObject`:

  <div className="side-by-side-container">
    <div className="side-by-side-block">
      ```cpp title="HybridMath.hpp"
      class HybridMath: public HybridObject {
      public:
        HybridMath(): HybridObject(NAME) { }

      public:
        double add(double a, double b);

      protected:
        void loadHybridMethods() override;

      private:
        static constexpr auto NAME = "Math";
      };
      ```
    </div>
    <div className="side-by-side-block">
      ```cpp title="HybridMath.cpp"
      double HybridMath::add(double a, double b) {
        return a + b;
      }

      void HybridMath::loadHybridMethods() {
        // register base methods (toString, ...)
        HybridObject::loadHybridMethods();
        // register custom methods (add)
        registerHybrids(this, [](Prototype& proto) {
          proto.registerHybridMethod(
            "add",
            &HybridMath::add
          );
        });
      }
      ```
    </div>
  </div>

  Then, register the Hybrid Object constructor somewhere on app startup - e.g. in `AppDelegate`'s `application:didFinishLaunchingWithOptions:`, or in your `cpp-adapter`'s JNI on load:

  ```cpp
  HybridObjectRegistry::registerHybridObjectConstructor(
    "Math",
    []() -> std::shared_ptr<HybridObject> {
      return std::make_shared<HybridMath>();
    }
  );
  ```

  </TabItem>
</Tabs>

## Using your Hybrid Objects

And finally, to initialize `HybridMath` from JS you just need to call `createHybridObject`:

```ts
export const MathModule = NitroModules.createHybridObject<Math>("Math")
const result = MathModule.add(5, 7)
```

:::note
If this call failed, you might have forgotten to register your Hybrid Object's constructor in the `HybridObjectRegistry`.
:::
