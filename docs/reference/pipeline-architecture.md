# Архитектура пайплайна домашнего секвенирования генома

## Open-Source Reference Architecture · Апрель 2026

---

## 1. Обзор архитектуры

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    HOME GENOME SEQUENCING PIPELINE                      │
│                     Open-Source Reference Architecture                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐            │
│  │  LAYER 0 │   │  LAYER 1 │   │  LAYER 2 │   │  LAYER 3 │            │
│  │  WET LAB │──▶│  SIGNAL  │──▶│ GENOMICS │──▶│ CLINICAL │            │
│  │          │   │PROCESSING│   │ ANALYSIS │   │INTERPRET.│            │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘            │
│   Экстракция     Бейзколлинг    Alignment      Annotation              │
│   Библиотека     QC сигнала     Variant Call    PGx / HLA              │
│   Секвенир.      Adaptive       SV / CNV       AI Models              │
│                  Sampling       Methylation     Reporting              │
│                                 Phasing                                │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  LAYER S: SECURITY & DATA SOVEREIGNTY                            │   │
│  │  Шифрование · Air-gap · Аудит · Резервирование                   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  LAYER O: ORCHESTRATION (Nextflow / Snakemake / bash)            │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Детальная диаграмма потока данных

```
                        ┌─────────────────┐
                        │   БИОМАТЕРИАЛ    │
                        │  (буккальный     │
                        │   мазок / кровь) │
                        └────────┬────────┘
                                 │
                    ─────────────┼───────────── LAYER 0: WET LAB
                                 ▼
                        ┌─────────────────┐
                        │  DNA EXTRACTION  │  NEB Monarch T3010
                        │  + QC (Qubit /   │  DIYnafluor
                        │    NanoDrop)     │
                        └────────┬────────┘
                                 │  gDNA 5–7 µg
                                 ▼
                        ┌─────────────────┐
                        │  LIBRARY PREP    │  ONT SQK-LSK114
                        │  End repair →    │  NEBNext Companion
                        │  A-tail →        │  AMPure XP beads
                        │  Adapter ligation│
                        └────────┬────────┘
                                 │  150–450 ng library
                                 ▼
                        ┌─────────────────┐
                        │  FLOW CELL LOAD  │  FLO-MIN114 (R10.4.1)
                        │  + SEQUENCING    │  MinION Mk1D
                        │  (48 hours)      │  MinKNOW
                        └────────┬────────┘
                                 │
                    ─────────────┼───────────── LAYER 1: SIGNAL PROCESSING
                                 │
                     ┌───────────┴───────────┐
                     ▼                       ▼
            ┌─────────────────┐    ┌──────────────────┐
            │  LIVE BASECALL  │    │  ADAPTIVE SAMPLE  │
            │  Dorado HAC     │    │  MinKNOW enrich   │
            │  (real-time)    │    │  + BED file       │
            └────────┬────────┘    └──────────────────┘
                     │
                     │  pod5 (raw signal) + BAM (live HAC)
                     ▼
            ┌─────────────────┐
            │  POST-BASECALL  │  Dorado SUP (optional, targeted regions)
            │  + METHYLATION  │  --modified-bases 5mC_5hmC
            └────────┬────────┘
                     │  unaligned BAM (reads + meth tags)
                     │
                    ─┼───────────────────── LAYER 2: GENOMICS ANALYSIS
                     ▼
            ┌─────────────────┐
            │  ALIGNMENT      │  minimap2 -ax map-ont
            │  + SORT + INDEX │  samtools sort / index
            └────────┬────────┘
                     │  aligned.bam + aligned.bam.bai
                     ▼
            ┌─────────────────┐
            │  COVERAGE QC    │  mosdepth
            │  + STATS        │  samtools flagstat
            │  + READ QC      │  NanoPlot / fastcat
            └────────┬────────┘
                     │  ✓ coverage ≥10× (WGS) / ≥30× (panel)
                     │  ✓ mapped >95%
                     ▼
         ┌───────────┼───────────┬───────────┬───────────┐
         ▼           ▼           ▼           ▼           ▼
   ┌───────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────┐
   │  SNV /    │ │  SV    │ │  CNV   │ │  STR   │ │  METHYL  │
   │  INDEL    │ │        │ │        │ │        │ │  ATION   │
   │           │ │        │ │        │ │        │ │          │
   │ Clair3    │ │Sniffles│ │QDNAseq │ │Straglr │ │ modkit   │
   │ v2.0      │ │   2    │ │        │ │        │ │          │
   └─────┬─────┘ └───┬────┘ └───┬────┘ └───┬────┘ └────┬─────┘
         │           │          │          │           │
         ▼           ▼          ▼          ▼           ▼
   ┌───────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────┐
   │ VCF (SNV) │ │VCF (SV)│ │BED/VCF │ │VCF/TSV │ │ bedMethyl│
   └─────┬─────┘ └───┬────┘ └───┬────┘ └───┬────┘ └────┬─────┘
         │           │          │          │           │
         ▼           ▼          ▼          ▼           ▼
   ┌──────────────────────────────────────────────────────────┐
   │                    PHASING (WhatsHap)                     │
   │         haplotagging + phase blocks + PS tags             │
   └────────────────────────┬─────────────────────────────────┘
                            │
                   ─────────┼──────── LAYER 3: CLINICAL INTERPRETATION
                            ▼
         ┌──────────────────┼──────────────────┐
         ▼                  ▼                  ▼
   ┌───────────┐    ┌─────────────┐    ┌─────────────┐
   │ ANNOTATION│    │  PHARMACO-  │    │  AI-BASED   │
   │           │    │  GENOMICS   │    │ INTERPRET.  │
   │ VEP       │    │             │    │             │
   │ SnpEff    │    │ PharmCAT    │    │ AlphaGenome │
   │ SnpSift   │    │ Cyrius      │    │ AlphaMissense│
   │ ClinVar   │    │ Stargazer   │    │ Evo 2       │
   │ vcfanno   │    │ HLA-LA      │    │             │
   └─────┬─────┘    └──────┬──────┘    └──────┬──────┘
         │                 │                  │
         ▼                 ▼                  ▼
   ┌──────────────────────────────────────────────────────────┐
   │               REPORTING & VISUALIZATION                   │
   │   MultiQC · IGV · methplotlib · custom HTML report        │
   └──────────────────────────────────────────────────────────┘
```

---

## 3. Каталог инструментов

### Layer 0: Wet Lab (не-софт)

| Этап | Протокол / Кит | Назначение |
|---|---|---|
| Экстракция ДНК | NEB Monarch T3010 | Буккальный мазок → чистая gDNA |
| QC концентрации | Qubit / DIYnafluor | Измерение нг/мкл |
| QC длин | Гель-электрофорез | Распределение фрагментов |
| Библиотека | ONT SQK-LSK114 + NEBNext E7672S | End-repair → A-tail → Adapter ligation |
| Очистка | AMPure XP beads | Магнитная очистка |
| Секвенирование | MinION Mk1D + FLO-MIN114 | 2 048 пор, 48 ч, 20–40 Гб |

### Layer 1: Signal Processing

| Инструмент | Версия (2026) | Лицензия | Функция | GPU |
|---|---|---|---|---|
| **MinKNOW** | ≥24.11.10 | Проприет. (бесплатно) | Управление секвенатором, adaptive sampling | — |
| **Dorado** | v0.8+ | Oxford Nanopore | Бейзколлинг (FAST/HAC/SUP), метилирование, `mv` move-table tags | ✅ CUDA / Metal |
| **pod5** | v0.3+ | MPL-2.0 | Чтение / конвертация сырых сигналов | — |

### Layer 2: Genomics Analysis

| Инструмент | Версия | Лицензия | Функция | Вход → Выход |
|---|---|---|---|---|
| **Dorado aligner** | v0.8+ | Oxford Nanopore | Alignment для HTS-выходов Dorado, использует minimap2 (`lr:hq`) внутри | unaligned BAM/SAM → aligned BAM |
| **minimap2** | 2.28+ | MIT | Бэкенд выравнивания для Dorado aligner и кастомных long-read flows | FASTQ/FASTA/HTS → aligned BAM/SAM |
| **samtools** | 1.20+ | MIT/Expat | Sort, index, flagstat, merge | BAM → BAM + BAI |
| **mosdepth** | 0.3+ | MIT | Расчёт покрытия по регионам | BAM → BED/TSV |
| **NanoPlot** | 1.43+ | GPL-3.0 | QC визуализация прочтений | BAM/fastq → PNG/HTML |
| **fastcat** | 0.18+ | MPL-2.0 | Быстрая статистика прочтений | BAM → TSV |
| **Clair3** | **v2.0** | BSD-3 | SNV + indel calling (PyTorch), включая dwell-time-aware ONT режим | BAM + `mv` tags → VCF |
| **Sniffles2** | 2.4+ | MIT | Структурные варианты | BAM → VCF |
| **cuteSV** | 2.1+ | MIT | SV (альтернатива Sniffles) | BAM → VCF |
| **QDNAseq** | 1.38+ | GPL-2.0 | Copy Number Variations | BAM → segments |
| **Straglr** | 1.6+ | MIT | Short Tandem Repeats | BAM → VCF/TSV |
| **modkit** | 0.4+ | Oxford Nanopore | Метилирование (5mC, 5hmC) | BAM → bedMethyl |
| **WhatsHap** | 2.3+ | MIT | Read-based phasing | BAM + VCF → phased VCF |
| **LongPhase** | 1.7+ | MIT | Быстрое фазирование (альтернатива) | BAM + VCF → phased VCF |

### Layer 3: Clinical Interpretation

| Инструмент | Лицензия | Функция | Вход → Выход |
|---|---|---|---|
| **Ensembl VEP** | Apache-2.0 | Предсказание функциональных эффектов вариантов | VCF → annotated VCF |
| **SnpEff** | LGPLv3 | Аннотация эффектов | VCF → annotated VCF |
| **SnpSift** | LGPLv3 | Фильтрация + интеграция ClinVar/dbSNP | VCF → filtered VCF |
| **vcfanno** | MIT | Аннотация VCF произвольными BED/VCF | VCF → enriched VCF |
| **ClinVar DB** | Public Domain | База клинической значимости вариантов | Загружаемый VCF |
| **PharmCAT** | MPL-2.0 | Фармакогеномический отчёт (star-аллели → рекомендации CPIC) | VCF → JSON/HTML report |
| **Cyrius** | BSD-3 | CYP2D6 star-allele calling из WGS | BAM → star-alleles |
| **Stargazer** | GPL-3.0 | Star-allele calling для PGx генов | BAM/VCF → star-alleles |
| **HLA-LA** | GPL-3.0 | HLA-типирование из длинных прочтений | BAM → HLA alleles |
| **Exomiser** | AGPL-3.0 | Приоритизация вариантов по фенотипу (HPO) | VCF + HPO → ranked variants |
| **MultiQC** | GPL-3.0 | Агрегация QC отчётов | Множество → HTML report |
| **IGV** | MIT | Визуальная инспекция прочтений / вариантов | BAM + VCF → GUI |
| **methplotlib** | MIT | Визуализация метилирования | bedMethyl → plots |

### AI-модели (Layer 3+)

| Модель | Провайдер | Доступ | Функция |
|---|---|---|---|
| **AlphaGenome** | Google DeepMind | API (non-commercial) | Эффекты некодирующих вариантов |
| **AlphaMissense** | Google DeepMind | Scores (downloadable) | Патогенность миссенс-мутаций |
| **Evo 2** | Arc Institute | Open weights (CC BY-NC) | Геномная foundation-модель |
| **SpliceAI** | Illumina | Apache-2.0 | Предсказание эффектов на сплайсинг |
| **CADD** | Унив. Вашингтона | Non-commercial | Интегративная скоринг-модель |

---

## 4. Референсная реализация: wf-human-variation

ONT поддерживает готовый Nextflow-пайплайн, объединяющий большинство инструментов Layer 2:

### Установка и запуск

```bash
# ═══════════════════════════════════════════════════════════
# Prerequisite: Nextflow + Docker/Singularity
# ═══════════════════════════════════════════════════════════
curl -s https://get.nextflow.io | bash
sudo mv nextflow /usr/local/bin/

# ═══════════════════════════════════════════════════════════
# Запуск wf-human-variation
# ═══════════════════════════════════════════════════════════
nextflow run epi2me-labs/wf-human-variation \
  --bam aligned.bam \
  --ref ref/GRCh38.fa \
  --bed panels/pharmacogenes.bed \
  --sample_name "HOME_GENOME_2026" \
  --snp \
  --sv \
  --cnv \
  --str \
  --mod \
  --phased \
  --out_dir results/ \
  -profile singularity \
  -resume
```

### Что даёт wf-human-variation из коробки

| Модуль | Инструмент | Выход |
|---|---|---|
| `--snp` | Clair3 | `{sample}.wf_snp.vcf.gz` |
| `--sv` | Sniffles2 | `{sample}.wf_sv.vcf.gz` |
| `--cnv` | QDNAseq | `{sample}_cnv.bed` |
| `--str` | Straglr | `{sample}_str.vcf.gz` |
| `--mod` | modkit | `{sample}.bedMethyl` |
| `--phased` | WhatsHap + LongPhase | Phase tags в BAM + phased VCF |
| QC | MultiQC + fastcat | HTML-отчёт |

### Минимальные требования

| Ресурс | Минимум | Рекомендация |
|---|---|---|
| CPU | 16 ядер | 32 ядра |
| RAM | 32 ГБ | 128 ГБ |
| Хранилище | 300 ГБ (1 прогон) | 1 ТБ SSD |
| GPU | Не обязательно (Clair3 CPU mode) | NVIDIA для Clair3 GPU (12–20 мин vs 2 ч) |
| Покрытие | ≥20× | ≥30× |

---

## 5. Кастомный пайплайн на bash (полная версия)

Для тех, кто предпочитает контроль over orchestration framework:

```bash
#!/usr/bin/env bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════
# HOME GENOME SEQUENCING PIPELINE
# Open-Source Reference Implementation
# April 2026
# ═══════════════════════════════════════════════════════════════

# ─── CONFIGURATION ────────────────────────────────────────────
SAMPLE="HOME_GENOME_001"
THREADS=16
REF="ref/GRCh38.fa"
BED="panels/pharmacogenes.bed"         # adaptive sampling panel
POD5_DIR="runs/2026-04-20/pod5"
MODELS_DIR="models"
DORADO_MODEL="dna_r10.4.1_e8.2_400bps_hac@v5.2.0"
DORADO_SUP_MODEL="dna_r10.4.1_e8.2_400bps_sup@v5.2.0"
CLINVAR_VCF="ref/clinvar_20260401.vcf.gz"
CLAIR3_MODEL="${MODELS_DIR}/clair3/r1041_e82_400bps_hac_with_mv"
OUT="results/${SAMPLE}"

mkdir -p "${OUT}"/{basecall,align,qc,variants,sv,methylation,phasing,annotation,pgx,reports}

# ─── STAGE 1: BASECALLING (HAC + methylation) ────────────────
echo ">>> [1/10] Basecalling (HAC + 5mC_5hmC)..."
dorado basecaller \
  -x auto \
  --emit-moves \
  --modified-bases 5mC_5hmC \
  "${MODELS_DIR}/${DORADO_MODEL}" \
  "${POD5_DIR}" \
  > "${OUT}/basecall/${SAMPLE}.unaligned.bam"

# Optional: SUP re-basecall for target regions only
# dorado basecaller -x auto \
#   "${MODELS_DIR}/${DORADO_SUP_MODEL}" \
#   "${POD5_DIR}" > "${OUT}/basecall/${SAMPLE}.sup.bam"

# ─── STAGE 2: ALIGNMENT ──────────────────────────────────────
echo ">>> [2/10] Alignment (Dorado aligner / minimap2 lr:hq)..."
dorado aligner \
  "${REF}" \
  "${OUT}/basecall/${SAMPLE}.unaligned.bam" \
  > "${OUT}/align/${SAMPLE}.sorted.bam"
samtools index -@ "${THREADS}" "${OUT}/align/${SAMPLE}.sorted.bam"

BAM="${OUT}/align/${SAMPLE}.sorted.bam"

# ─── STAGE 3: QC ─────────────────────────────────────────────
echo ">>> [3/10] Quality Control..."

# Basic stats
samtools flagstat "${BAM}" > "${OUT}/qc/flagstat.txt"
samtools stats "${BAM}" > "${OUT}/qc/stats.txt"

# Coverage
mosdepth \
  --by "${BED}" \
  --threads "${THREADS}" \
  "${OUT}/qc/${SAMPLE}" \
  "${BAM}"

# Read length / quality distribution
NanoPlot \
  --bam "${BAM}" \
  --outdir "${OUT}/qc/nanoplot" \
  --threads "${THREADS}" \
  --plots hex dot

# Verify coverage threshold
MEAN_COV=$(awk '/^total/ {print $4}' "${OUT}/qc/${SAMPLE}.mosdepth.summary.txt")
echo "    Mean coverage: ${MEAN_COV}x"

# ─── STAGE 4: SMALL VARIANT CALLING ──────────────────────────
echo ">>> [4/10] SNV + Indel calling (Clair3 v2.0, dwell-time aware)..."
run_clair3.sh \
  --bam_fn="${BAM}" \
  --ref_fn="${REF}" \
  --output="${OUT}/variants" \
  --threads="${THREADS}" \
  --platform="ont" \
  --model_path="${CLAIR3_MODEL}" \
  --sample_name="${SAMPLE}" \
  --enable_dwell_time \
  --include_all_ctgs

# Clair3 v2.0 expects mv tags from Dorado --emit-moves for signal-aware calling.
# If mv tags are absent, disable --enable_dwell_time or re-basecall with Dorado.

SNV_VCF="${OUT}/variants/merge_output.vcf.gz"

# ─── STAGE 5: STRUCTURAL VARIANT CALLING ─────────────────────
echo ">>> [5/10] Structural Variants (Sniffles2)..."
sniffles \
  --input "${BAM}" \
  --vcf "${OUT}/sv/${SAMPLE}.sv.vcf.gz" \
  --reference "${REF}" \
  --threads "${THREADS}" \
  --sample-id "${SAMPLE}" \
  --minsvlen 50

# ─── STAGE 6: METHYLATION ────────────────────────────────────
echo ">>> [6/10] Methylation analysis (modkit)..."
modkit pileup \
  "${BAM}" \
  "${OUT}/methylation/${SAMPLE}.bedMethyl" \
  --ref "${REF}" \
  --threads "${THREADS}" \
  --filter-threshold 0.75

# ─── STAGE 7: PHASING ────────────────────────────────────────
echo ">>> [7/10] Haplotype phasing (WhatsHap)..."

# Phase SNVs
whatshap phase \
  --reference "${REF}" \
  --output "${OUT}/phasing/${SAMPLE}.phased.vcf.gz" \
  "${SNV_VCF}" \
  "${BAM}"

# Haplotag BAM
whatshap haplotag \
  --reference "${REF}" \
  --output "${OUT}/phasing/${SAMPLE}.haplotagged.bam" \
  "${OUT}/phasing/${SAMPLE}.phased.vcf.gz" \
  "${BAM}"
samtools index "${OUT}/phasing/${SAMPLE}.haplotagged.bam"

# Phasing stats
whatshap stats \
  "${OUT}/phasing/${SAMPLE}.phased.vcf.gz" \
  > "${OUT}/phasing/phasing_stats.txt"

# ─── STAGE 8: VARIANT ANNOTATION ─────────────────────────────
echo ">>> [8/10] Variant annotation (VEP + ClinVar)..."

# Ensembl VEP
vep \
  --input_file "${OUT}/phasing/${SAMPLE}.phased.vcf.gz" \
  --output_file "${OUT}/annotation/${SAMPLE}.vep.vcf" \
  --vcf \
  --offline \
  --cache \
  --force_overwrite \
  --assembly GRCh38 \
  --fasta "${REF}" \
  --everything \
  --plugin SpliceAI,snv=spliceai_scores.masked.snv.hg38.vcf.gz,indel=spliceai_scores.masked.indel.hg38.vcf.gz \
  --fork "${THREADS}"

# ClinVar integration
vcfanno \
  -p "${THREADS}" \
  clinvar_annotation.toml \
  "${OUT}/annotation/${SAMPLE}.vep.vcf" \
  > "${OUT}/annotation/${SAMPLE}.annotated.vcf"

# ─── STAGE 9: PHARMACOGENOMICS ───────────────────────────────
echo ">>> [9/10] Pharmacogenomics..."

# CYP2D6 star-allele calling
cyrius \
  --bam "${BAM}" \
  --genome 38 \
  --output "${OUT}/pgx" \
  --prefix "${SAMPLE}"

# PharmCAT (full PGx report)
java -jar pharmcat.jar \
  -vcf "${OUT}/phasing/${SAMPLE}.phased.vcf.gz" \
  -reporterJson \
  -o "${OUT}/pgx/${SAMPLE}_pharmcat"

# HLA typing
HLA-LA \
  --BAM "${BAM}" \
  --graph PRG_MHC_GRCh38_withIMGT \
  --sampleID "${SAMPLE}" \
  --maxThreads "${THREADS}" \
  --workingDir "${OUT}/pgx/hla"

# ─── STAGE 10: REPORTING ─────────────────────────────────────
echo ">>> [10/10] Generating reports..."

# Aggregate QC
multiqc \
  "${OUT}/qc" \
  "${OUT}/variants" \
  "${OUT}/sv" \
  -o "${OUT}/reports" \
  --title "Home Genome: ${SAMPLE}"

echo "═══════════════════════════════════════════════════"
echo "  PIPELINE COMPLETE"
echo "  Results: ${OUT}/"
echo "  QC Report: ${OUT}/reports/multiqc_report.html"
echo "  Variants: ${OUT}/annotation/${SAMPLE}.annotated.vcf"
echo "  PGx: ${OUT}/pgx/${SAMPLE}_pharmcat/"
echo "  HLA: ${OUT}/pgx/hla/"
echo "  Methylation: ${OUT}/methylation/${SAMPLE}.bedMethyl"
echo "═══════════════════════════════════════════════════"
```

---

## 6. Структура выходных данных

```
results/HOME_GENOME_001/
├── basecall/
│   └── HOME_GENOME_001.unaligned.bam          # ~6 GB
├── align/
│   ├── HOME_GENOME_001.sorted.bam             # ~8 GB
│   └── HOME_GENOME_001.sorted.bam.bai
├── qc/
│   ├── flagstat.txt                            # alignment stats
│   ├── stats.txt                               # samtools stats
│   ├── HOME_GENOME_001.mosdepth.summary.txt   # per-region coverage
│   ├── HOME_GENOME_001.mosdepth.bed.gz        # detailed coverage
│   └── nanoplot/                               # read distribution plots
├── variants/
│   ├── merge_output.vcf.gz                     # SNV + indels (Clair3)
│   └── merge_output.vcf.gz.tbi
├── sv/
│   ├── HOME_GENOME_001.sv.vcf.gz              # structural variants
│   └── HOME_GENOME_001.sv.vcf.gz.tbi
├── methylation/
│   └── HOME_GENOME_001.bedMethyl              # per-CpG methylation
├── phasing/
│   ├── HOME_GENOME_001.phased.vcf.gz          # haplotype-phased variants
│   ├── HOME_GENOME_001.haplotagged.bam        # BAM with HP tags
│   └── phasing_stats.txt                       # phase block stats
├── annotation/
│   ├── HOME_GENOME_001.vep.vcf                # VEP annotated
│   └── HOME_GENOME_001.annotated.vcf          # + ClinVar
├── pgx/
│   ├── HOME_GENOME_001.cyrius.tsv             # CYP2D6 star-alleles
│   ├── HOME_GENOME_001_pharmcat/              # CPIC drug recommendations
│   │   ├── report.html
│   │   └── report.json
│   └── hla/                                    # HLA alleles
│       └── hla_result.txt
├── reports/
│   └── multiqc_report.html                     # aggregated QC dashboard
└── raw/
    └── pod5/                                   # raw signal (~49 GB)
```

**Общий объём данных на 1 прогон:** ~70–100 ГБ

---

## 7. Модель безопасности и суверенитета данных

### Принцип: Zero-Trust, Air-Gapped by Default

```
┌─────────────────────────────────────────────────────────┐
│              DATA SOVEREIGNTY MODEL                      │
│                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────┐   │
│  │  SEQUENCING  │    │   ANALYSIS   │    │ STORAGE  │   │
│  │   MACHINE    │    │   MACHINE    │    │          │   │
│  │              │    │              │    │          │   │
│  │ MinION+Laptop│───▶│ Workstation  │───▶│ Encrypted│   │
│  │              │    │ (offline OK) │    │   NAS    │   │
│  │  Air-gapped  │    │  Air-gapped  │    │          │   │
│  │  during run  │    │  during      │    │ LUKS /   │   │
│  │              │    │  analysis    │    │ VeraCrypt│   │
│  └──────────────┘    └──────────────┘    └──────────┘   │
│                                                          │
│  ⛔ Данные НИКОГДА не покидают локальную сеть             │
│  ⛔ Нет cloud upload / telemetry                         │
│  ⛔ Нет API-вызовов с геномными данными                  │
│                                                          │
│  ✅ AI-модели скачиваются ОДИН РАЗ, работают оффлайн     │
│  ✅ Базы данных (ClinVar, dbSNP) — локальные копии       │
│  ✅ VEP работает в offline-режиме с локальным кэшем      │
└─────────────────────────────────────────────────────────┘
```

### Чек-лист безопасности

| # | Мера | Реализация | Критичность |
|---|---|---|---|
| 1 | Шифрование диска | LUKS (Linux) / FileVault (Mac) / BitLocker (Win) | 🔴 Обязательно |
| 2 | Шифрование бэкапов | VeraCrypt контейнер / `gpg -c` | 🔴 Обязательно |
| 3 | Изоляция сети | Air-gap или VLAN без интернета во время анализа | 🟡 Рекомендуется |
| 4 | MinKNOW telemetry | Отключить phone-home в настройках | 🟡 Рекомендуется |
| 5 | Offline VEP | `--offline --cache` (предварительно скачать ~30 ГБ) | 🟡 Рекомендуется |
| 6 | Offline ClinVar | Скачать VCF: `ftp.ncbi.nlm.nih.gov/pub/clinvar/` | 🟡 Рекомендуется |
| 7 | Offline AlphaMissense | Скачать scores TSV (~6 ГБ) | 🟢 Опционально |
| 8 | Аудит-лог | `script` / `tee` все команды в лог | 🟢 Опционально |
| 9 | Бэкап pod5 | 3-2-1: 3 копии, 2 носителя, 1 off-site | 🟡 Рекомендуется |
| 10 | Утилизация | Автоклав пробирок или замачивание в 10% хлорке 30 мин | 🟢 Рекомендуется |

### Что нельзя загружать в облако

| Тип данных | Пример | Риск |
|---|---|---|
| Сырой сигнал | pod5 файлы | Реконструируемый геном |
| Выровненные прочтения | aligned.bam | Полный геном |
| Файл вариантов | .vcf | Все ваши мутации |
| Фармакогеномика | PharmCAT report | Как вы метаболизируете лекарства |
| HLA-типирование | HLA alleles | Иммунный профиль |

---

## 8. Конфигурации под разные бюджеты

### Tier 1: Минимальный ($1 400 за прогон)

```
Железо:    MacBook Air M3 (имеющийся)
Пипетки:   AliExpress + DIY калибровка
Термоблок: AliExpress (~$50)
Центрифуга: eBay б/у (~$100)
Вортекс:   eBay б/у (~$30)
Магнит:    Один магнит N52 в руке
───────────────────────────────
Пайплайн:  bash-скрипт, HAC live
Variant:   Clair3 CPU mode (~2 ч)
Annotation: SnpEff + ClinVar (лёгкий)
PGx:       PharmCAT
```

### Tier 2: Оптимальный ($5 500 setup + $1 100/прогон)

```
Железо:    Mac Studio M3 Pro/Ultra + 64 ГБ RAM
Пипетки:   Gilson б/у, откалиброванные
Лаб. набор: Полный (термоблок, центрифуга, вортекс, штатив)
MinION:    Собственный Mk1D ($3 200)
───────────────────────────────
Пайплайн:  wf-human-variation (Nextflow)
Variant:   Clair3 Metal GPU (~30 мин)
Annotation: VEP + ClinVar + SpliceAI (полный)
PGx:       PharmCAT + Cyrius + HLA-LA
AI:        AlphaMissense scores (offline)
```

### Tier 3: Максимальный ($12 000+ setup)

```
Железо:    Workstation с NVIDIA RTX 4090/5090 + 128 ГБ RAM
           + Mac Studio для MinKNOW
Лаб.:      Полный набор + Qubit + гель
MinION:    Mk1D + 3 запасных ячейки
NAS:       Synology + LUKS, 4 ТБ
───────────────────────────────
Пайплайн:  wf-human-variation + кастомные шаги
Basecall:  SUP на GPU (~31 ч full genome)
Variant:   Clair3 GPU + PEPPER-DeepVariant (cross-validation)
Annotation: VEP + SnpEff (concordance check) + ClinVar + CADD
PGx:       PharmCAT + Cyrius + Stargazer + HLA-LA
AI:        AlphaGenome API + AlphaMissense + Evo 2
30× WGS:  3 последовательных прогона, merge
```

---

## 9. Таблица совместимости инструментов

```
                   minimap2  Clair3  Sniffles2  WhatsHap  modkit  VEP  PharmCAT
                   ────────  ──────  ─────────  ────────  ──────  ───  ────────
Linux x86_64          ✅       ✅       ✅         ✅       ✅     ✅     ✅
Linux ARM64           ✅       ⚠️       ✅         ✅       ✅     ✅     ✅
macOS Apple Silicon   ✅       ✅       ✅         ✅       ✅     ✅     ✅
Windows (WSL2)        ✅       ✅       ✅         ✅       ✅     ✅     ✅
Docker                ✅       ✅       ✅         ✅       ✅     ✅     ✅
Singularity           ✅       ✅       ✅         ✅       ✅     ✅     ✅
GPU (CUDA)            —        ✅       —          —        —      —     —
GPU (Metal)           —        ✅*      —          —        —      —     —

* Clair3 Metal через Dorado integration
⚠️ Clair3 ARM64: community builds, не официально
```

---

## 10. Мониторинг и валидация

### Контрольные точки (Quality Gates)

```
GATE 1: Post-Extraction
  ├── Концентрация ≥ 50 ng/µL (Qubit)
  ├── Объём ≥ 20 µL
  └── A260/280 = 1.8–2.0 (чистота)
       │
       ▼ PASS → продолжаем
       ✗ FAIL → повторная экстракция

GATE 2: Post-Library
  ├── Концентрация = 10–30 ng/µL
  └── Объём = 15 µL
       │
       ▼ PASS → загружаем ячейку

GATE 3: Post-Sequencing
  ├── Yield ≥ 20 Гб
  ├── Read N50 ≥ 4 кб (щека) / ≥ 10 кб (кровь)
  └── Median quality ≥ Q15 (HAC)
       │
       ▼ PASS → пайплайн анализа

GATE 4: Post-Alignment
  ├── Mapped reads ≥ 95%
  ├── Mean coverage ≥ 10× (WGS) / ≥ 30× (panel)
  └── Coverage uniformity > 0.6
       │
       ▼ PASS → variant calling

GATE 5: Post-Variant Calling
  ├── SNV count ~4–5M (WGS) / пропорционально (panel)
  ├── Ti/Tv ratio 2.0–2.1 (WGS)
  ├── Het/Hom ratio 1.5–2.0
  └── SV count ~20 000–30 000 (WGS)
       │
       ▼ PASS → annotation + interpretation
```

### Валидация panel-specific

```bash
# Проверка обогащения adaptive sampling
awk '{sum += $4} END {print "Mean panel coverage:", sum/NR}' \
  results/*/qc/*.regions.bed

# Ожидание для 1% панели:
# 5–6× обогащение vs genome-wide average
# Если ≈1× → adaptive sampling не работал
# Если >10× → BED меньше ожидаемого
```

---

## 11. Стратегия хранения pod5 / BAM

| Данные | Размер (1 прогон) | Хранить? | Почему |
|---|---|---|---|
| pod5 (сырой сигнал) | ~49 ГБ | **ДА** (долгосрочно) | Можно перебейзколлить более точной моделью в будущем |
| Unaligned BAM (HAC) | ~6 ГБ | Опционально | Промежуточный, воспроизводим из pod5 |
| Aligned BAM | ~8 ГБ | **ДА** | Основной рабочий файл |
| VCF (variants) | ~50 МБ | **ДА** | Ваши мутации |
| bedMethyl | ~200 МБ | **ДА** | Эпигенетика |
| PharmCAT report | ~1 МБ | **ДА** | Фармакогеномика |
| MultiQC report | ~5 МБ | **ДА** | Документация прогона |

**Правило 3-2-1:** 3 копии, 2 разных носителя (SSD + HDD/NAS), 1 оффсайт (зашифрованный внешний диск в другом помещении).

---

## 12. Roadmap расширений

| Приоритет | Расширение | Инструменты | Зависимости |
|---|---|---|---|
| P0 | Базовый пайплайн (эта статья) | Dorado → minimap2 → Clair3 → VEP | Нет |
| P1 | Фармакогеномика | + PharmCAT + Cyrius + HLA-LA | Java 17+, Python 3.10+ |
| P2 | Эпигенетика | + modkit + methplotlib | Доп. 200 ГБ хранилище |
| P3 | de novo сборка | + Flye + HERRO + Medaka | ≥64 ГБ RAM, >30× покрытие |
| P4 | AI-интерпретация | + AlphaGenome API + Evo 2 | GPU, API-ключи |
| P5 | Семейное трио | + Clair3-Trio + менделевский фильтр | 3 образца × 3 ячейки |
| P6 | Продольный мониторинг | Повторные прогоны → дифф. метилирование | Временные точки |
| P7 | Автоматизация | Nextflow pipeline + Web UI | Docker, 32 ГБ RAM |

---

## 13. Future Architecture: Горизонт 2031–2036

Через 5–10 лет представленная архитектура претерпит фундаментальный сдвиг. *Layer 1 (Signal Processing)* и *Layer 2 (Genomics Analysis)* сольются в единый AI-Native слой, а *Layer 0 (Wet Lab)* станет полностью аппаратным.

### Ожидаемые сдвиги в пайплайне:
1. **Solid-State Nanopores:** Отказ от белковых мембран в пользу графеновых твердотельных пор. Секвенатор будет встроен прямо в смартфон или умные часы. Никакого «storage at +4°C», бесконечный shelf-life.
2. **Zero-Assembly AI Model:** Исчезнут понятия `minimap2`, выравнивания и VCF-файлов. Гигантский мультимодальный трансформер (поколение Evo 5+) будет потреблять RAW-сигнал тока напрямую с чипа и сразу выдавать граф клинических решений. Сигнал → Фенотип.
3. **Continuous Multi-omics:** Нанопоры научатся читать пептиды (белки) так же эффективно, как генетический код. Пайплайн сможет строить ваш транскриптом и протеом в реальном времени.
4. **Связка Read-Write:** Интеграция секвенатора с экосистемой вроде **OpenRNA / SynAPS**. Мы будем читать геном, находить экспрессионный дефицит и отправлять задание на домашний ДНК/РНК-принтер для локальной сборки персональной мРНК-вакцины или терапевтической липидной наночастицы для компенсации функции.

---

*Архитектура актуальна на 21 апреля 2026 года. Все перечисленные инструменты — open-source (за исключением MinKNOW и Dorado — бесплатных, но проприетарных). Версии инструментов необходимо верифицировать перед развёртыванием.*
