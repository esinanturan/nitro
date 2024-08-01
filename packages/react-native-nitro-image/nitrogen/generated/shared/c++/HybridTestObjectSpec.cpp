///
/// HybridTestObjectSpec.cpp
/// Thu Aug 01 2024
/// This file was generated by nitrogen. DO NOT MODIFY THIS FILE.
/// https://github.com/mrousavy/react-native-nitro
/// Copyright © 2024 Marc Rousavy @ Margelo
///

#include "HybridTestObjectSpec.hpp"

namespace margelo::nitro::image {

  void HybridTestObjectSpec::loadHybridMethods() {
    // load base methods/properties
    HybridObject::loadHybridMethods();
    // load custom methods/properties
    registerHybridGetter("valueThatWillThrowOnAccess", &HybridTestObjectSpec::getValueThatWillThrowOnAccess, this);
    registerHybridSetter("valueThatWillThrowOnAccess", &HybridTestObjectSpec::setValueThatWillThrowOnAccess, this);
    registerHybridMethod("createMap", &HybridTestObjectSpec::createMap, this);
    registerHybridMethod("mapRoundtrip", &HybridTestObjectSpec::mapRoundtrip, this);
    registerHybridMethod("funcThatThrows", &HybridTestObjectSpec::funcThatThrows, this);
    registerHybridMethod("passVariant", &HybridTestObjectSpec::passVariant, this);
    registerHybridMethod("flip", &HybridTestObjectSpec::flip, this);
    registerHybridMethod("passTuple", &HybridTestObjectSpec::passTuple, this);
    registerHybridMethod("getValueFromJsCallback", &HybridTestObjectSpec::getValueFromJsCallback, this);
  }

} // namespace margelo::nitro::image
