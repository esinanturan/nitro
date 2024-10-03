///
/// HybridImageSpecSwift.hpp
/// This file was generated by nitrogen. DO NOT MODIFY THIS FILE.
/// https://github.com/mrousavy/nitro
/// Copyright © 2024 Marc Rousavy @ Margelo
///

#pragma once

#include "HybridImageSpec.hpp"

// Forward declaration of `HybridImageSpecCxx` to properly resolve imports.
namespace NitroImage { class HybridImageSpecCxx; }

// Forward declaration of `ImageSize` to properly resolve imports.
namespace margelo::nitro::image { struct ImageSize; }
// Forward declaration of `PixelFormat` to properly resolve imports.
namespace margelo::nitro::image { enum class PixelFormat; }
// Forward declaration of `ImageFormat` to properly resolve imports.
namespace margelo::nitro::image { enum class ImageFormat; }

#include "ImageSize.hpp"
#include "PixelFormat.hpp"
#include "ImageFormat.hpp"
#include <string>
#include <functional>

#if __has_include(<NitroModules/HybridContext.hpp>)
#include <NitroModules/HybridContext.hpp>
#else
#error NitroModules cannot be found! Are you sure you installed NitroModules properly?
#endif

#include "NitroImage-Swift-Cxx-Umbrella.hpp"

namespace margelo::nitro::image {

  /**
   * The C++ part of HybridImageSpecCxx.swift.
   *
   * HybridImageSpecSwift (C++) accesses HybridImageSpecCxx (Swift), and might
   * contain some additional bridging code for C++ <> Swift interop.
   *
   * Since this obviously introduces an overhead, I hope at some point in
   * the future, HybridImageSpecCxx can directly inherit from the C++ class HybridImageSpec
   * to simplify the whole structure and memory management.
   */
  class HybridImageSpecSwift: public virtual HybridImageSpec {
  public:
    // Constructor from a Swift instance
    explicit HybridImageSpecSwift(const NitroImage::HybridImageSpecCxx& swiftPart):
      HybridObject(HybridImageSpec::TAG),
      _swiftPart(swiftPart) { }

  public:
    // Get the Swift part
    inline NitroImage::HybridImageSpecCxx getSwiftPart() noexcept { return _swiftPart; }

  public:
    // Get memory pressure
    inline size_t getExternalMemorySize() noexcept override {
      return _swiftPart.getMemorySize();
    }

  public:
    // Properties
    inline ImageSize getSize() noexcept override {
      auto result = _swiftPart.getSize();
      return result;
    }
    inline PixelFormat getPixelFormat() noexcept override {
      auto result = _swiftPart.getPixelFormat();
      return static_cast<PixelFormat>(result);
    }
    inline double getSomeSettableProp() noexcept override {
      return _swiftPart.getSomeSettableProp();
    }
    inline void setSomeSettableProp(double someSettableProp) noexcept override {
      _swiftPart.setSomeSettableProp(std::forward<decltype(someSettableProp)>(someSettableProp));
    }

  public:
    // Methods
    inline double toArrayBuffer(ImageFormat format) override {
      auto __result = _swiftPart.toArrayBuffer(static_cast<int>(format));
      return __result;
    }
    inline void saveToFile(const std::string& path, const std::function<void(const std::string& /* path */)>& onFinished) override {
      _swiftPart.saveToFile(path, onFinished);
    }

  private:
    NitroImage::HybridImageSpecCxx _swiftPart;
  };

} // namespace margelo::nitro::image
