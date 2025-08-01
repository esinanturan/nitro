///
/// HybridBaseSpecSwift.hpp
/// This file was generated by nitrogen. DO NOT MODIFY THIS FILE.
/// https://github.com/mrousavy/nitro
/// Copyright © 2025 Marc Rousavy @ Margelo
///

#pragma once

#include "HybridBaseSpec.hpp"

// Forward declaration of `HybridBaseSpec_cxx` to properly resolve imports.
namespace NitroTest { class HybridBaseSpec_cxx; }





#include "NitroTest-Swift-Cxx-Umbrella.hpp"

namespace margelo::nitro::test {

  /**
   * The C++ part of HybridBaseSpec_cxx.swift.
   *
   * HybridBaseSpecSwift (C++) accesses HybridBaseSpec_cxx (Swift), and might
   * contain some additional bridging code for C++ <> Swift interop.
   *
   * Since this obviously introduces an overhead, I hope at some point in
   * the future, HybridBaseSpec_cxx can directly inherit from the C++ class HybridBaseSpec
   * to simplify the whole structure and memory management.
   */
  class HybridBaseSpecSwift: public virtual HybridBaseSpec {
  public:
    // Constructor from a Swift instance
    explicit HybridBaseSpecSwift(const NitroTest::HybridBaseSpec_cxx& swiftPart):
      HybridObject(HybridBaseSpec::TAG),
      _swiftPart(swiftPart) { }

  public:
    // Get the Swift part
    inline NitroTest::HybridBaseSpec_cxx& getSwiftPart() noexcept {
      return _swiftPart;
    }

  public:
    inline size_t getExternalMemorySize() noexcept override {
      return _swiftPart.getMemorySize();
    }
    void dispose() noexcept override {
      _swiftPart.dispose();
    }

  public:
    // Properties
    inline double getBaseValue() noexcept override {
      return _swiftPart.getBaseValue();
    }

  public:
    // Methods
    

  private:
    NitroTest::HybridBaseSpec_cxx _swiftPart;
  };

} // namespace margelo::nitro::test
