///
/// Variant_Car_Person.kt
/// This file was generated by nitrogen. DO NOT MODIFY THIS FILE.
/// https://github.com/mrousavy/nitro
/// Copyright © 2025 Marc Rousavy @ Margelo
///

package com.margelo.nitro.test

import com.facebook.proguard.annotations.DoNotStrip


/**
 * Represents the TypeScript variant "Car|Person".
 */
@Suppress("ClassName")
@DoNotStrip
sealed class Variant_Car_Person {
  @DoNotStrip
  data class First(@DoNotStrip val value: Car): Variant_Car_Person()
  @DoNotStrip
  data class Second(@DoNotStrip val value: Person): Variant_Car_Person()

  inline fun <reified T> getAs(): T? = when (this) {
    is First -> value as? T
    is Second -> value as? T
  }

  val isFirst: Boolean
    get() = this is First
  val isSecond: Boolean
    get() = this is Second

  companion object {
    @JvmStatic
    @DoNotStrip
    fun create(value: Car): Variant_Car_Person = First(value)
    @JvmStatic
    @DoNotStrip
    fun create(value: Person): Variant_Car_Person = Second(value)
  }
}
