# E-MAX Smart Quote - Branding & Copy Strategy

This document outlines the core branding, SEO, and copy elements for the E-MAX Smart Quote platform, based on `http://www.e-max.kr/`.

## 1. Brand Identity
- **Company Name**: E-MAX Worldwide Express (이맥스 국제특송)
- **Slogan**: "정직과 신용으로 고객에게 최선을 다하는 기업" (A company doing its best for customers with integrity and credit)
- **Primary Color**: E-MAX Red (`#dc2626`)
- **Key Values**: Trust, Speed, Nationwide Network (36 offices).

## 2. SEO Strategy
- **Title**: E-MAX — 국제특송 스마트 견적 시스템
- **Description**: 전 세계 220+개국 Door-to-Door 국제특송 운임을 실시간으로 확인하세요. 정직과 신용의 E-MAX Worldwide Express.
- **Keywords**: E-MAX, 이맥스, 국제특송, 종합물류, 해외배송, 중국특송, 베트남특송, 물류서비스, 퀵서비스, 해외운송, 국제운송.

> **목적지 국가 수 표기 정책 (2026-08-31 실측 기준)**: 마케팅·랜딩 표기는 **`220+`** 로 통일한다. 근거는 **UPS·DHL·FedEx 세 캐리어가 모두 자사 공식 표현으로 "220+ countries and territories" 를 쓴다**는 것이며, 우리 요율 커버리지가 그보다 넓으므로 모순되지 않는다. smart-quote-main 과 **같은 정책**이다 — 한쪽만 바꾸면 두 사이트가 다른 숫자를 광고하게 된다.
>
> **코드에서 센 실제 수치** (`src/config/`, 2026-08-31):
>
> | 구분 | emax | main |
> |---|---|---|
> | `UPS_ZONE_MAP` | 202 | 203 |
> | `DHL_ZONE_MAP` | 227 | 228 |
> | `FEDEX_ZONE_MAP` | 205 | 205 |
> | **요율 합집합** (어느 캐리어로든 요율 존재) | **237** | **237** |
> | **`COUNTRY_OPTIONS`** (드롭다운에서 고를 수 있음) | **191** | 192 |
> | **실제 즉시 견적 가능** (둘의 교집합) | **190** | 191 |
>
> ⚠️ **이전 정책 문구는 근거 숫자가 틀렸다.** "최대 약 265개국" 이라 적혀 있었으나 코드가 뒷받침하지 않으며(합집합 237), 그 위에 세운 `250+` 는 **ISO 3166-1 전체 코드 수(249)보다 큰 주장**이었다. 캐리어 본인들도 220+ 만 주장한다. 숫자를 올릴 때는 반드시 위 표를 다시 세고 근거를 함께 적을 것.
>
> ⚠️ **요율은 있는데 고를 수 없는 국가가 47개 있다**(237 − 190). 대부분 소규모 속령과 제재 대상국이다. 카피를 220+ 로 올리려면 `COUNTRY_OPTIONS` 를 먼저 넓혀야 하며, 그 전까지 "1초 만에 견적 완료" 가 실제로 성립하는 범위는 **190개국**이다.
>
> 숫자는 **한 곳에만** 둔다: 랜딩 통계 타일은 `value` 에 `220+` 를 넣고 `landing.stat.countries` 라벨은 `목적지 국가` / `Destinations` 로 숫자를 빼둔다. 라벨에도 숫자를 넣으면 타일이 `220+` 위에 `220개 목적지 국가` 를 겹쳐 보여주고, `+` 유무까지 어긋난다.

## 3. Core Copy (Korean)

### Hero Section
- **Main Heading**: 220+개국 국제 운임, 1초 만에 견적 완료.
- **Sub-heading**: 정직과 신용으로 고객에게 최선을 다하는 기업, 이맥스 국제특송(E-MAX)의 스마트 견적 시스템입니다.

### Features
- **즉시 운임 견적**: Door-to-Door, Door-to-Airport 요금을 실시간 환율과 FSC를 반영하여 즉시 계산합니다.
- **투명한 비용 구조**: 국제 운임, 유류할증료(FSC), 포장비, 부가서비스까지 항목별로 투명하게 세분화합니다.
- **합리적인 중량 산정**: 0.5kg 단위 반올림 정책(0.5kg Step Rounding)을 적용하여 과다 청구를 방지하고 합리적인 운임을 제공합니다.
- **전국 네트워크**: 36개 국내 지사망을 보유한 이맥스만의 강력한 물류 인프라를 통해 안전한 배송을 보장합니다.

### Footer
- **본사**: 충청북도 청주시 흥덕구 지동로 11-3
- **허브센터**: 경기도 김포시 고촌읍 태리 1018-1번지
- **대표번호**: 1588-0033
- **팩스**: 043-232-4522

## 4. Core Copy (English)

### Hero Section
- **Main Heading**: Freight Quotes for 220+ Countries, Instantly.
- **Sub-heading**: E-MAX Worldwide Express - A company doing its best for customers with integrity and credit.

### Footer
- © 2026 E-MAX Worldwide Express. Your Trusted Logistics Partner. All rights reserved.
