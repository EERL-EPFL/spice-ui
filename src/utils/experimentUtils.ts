// Utility functions for experiment data processing
import { WellSummary } from '../components/TrayGrid';

interface TreatmentResultsSummary {
    treatment: any;
    wells: WellSummary[];
    wells_frozen: number;
    wells_liquid: number;
}

interface SampleResultsSummary {
    sample: any;
    treatments: TreatmentResultsSummary[];
}

/**
 * Flattens hierarchical sample_results into a flat array of well summaries
 * for backwards compatibility with existing UI components
 */
export const flattenSampleResults = (sampleResults: SampleResultsSummary[]): WellSummary[] => {
    return sampleResults.flatMap(sr => 
        sr.treatments.flatMap(tr => tr.wells)
    );
};