import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'react-toastify';
import { diseaseService } from '../../services';
import { useAsyncAction, useAsyncData } from '../../hooks/useAsyncData';
import ErrorMessage, { FieldErrorList } from '../../components/ErrorMessage';
import LinkButton from '../../components/LinkButton';
import { FullPageLoader } from '../../components/LoadingSpinner';

const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];

/** The six bullet-list sections of the schema, in the order they are shown. */
const LIST_FIELDS = [
  { key: 'symptoms', label: 'Symptoms', hint: 'One bullet per line', required: true },
  { key: 'causes', label: 'Causes', hint: 'One bullet per line', required: true },
  { key: 'organicRemedies', label: 'Organic remedies', hint: 'One bullet per line', required: true },
  { key: 'chemicalTreatment', label: 'Chemical treatment', hint: 'One bullet per line', required: true },
  { key: 'prevention', label: 'Prevention', hint: 'One bullet per line', required: true },
  { key: 'precautions', label: 'Precautions', hint: 'One bullet per line', required: true },
];

/** Blank record used when creating a new disease. */
const emptyForm = () => ({
  diseaseName: '',
  plantName: '',
  description: '',
  severity: 'Medium',
  symptoms: '',
  causes: '',
  organicRemedies: '',
  chemicalTreatment: '',
  prevention: '',
  precautions: '',
  pathogenType: '',
  favourableConditions: '',
  imageUrl: '',
  mlLabels: '',
  isActive: true,
});

/**
 * Create / edit form for one knowledge-base record (`/admin/diseases/new` and
 * `/admin/diseases/:id/edit`).
 *
 * The bullet sections are edited as plain multi-line text because that is far
 * faster to type than six separate "add bullet" widgets, and the API accepts
 * arrays or comma/newline separated strings.
 */
export default function DiseaseForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [errorList, setErrorList] = useState([]);

  const existing = useAsyncData(
    () => (isEditing ? diseaseService.getById(id) : Promise.resolve(null)),
    [id, isEditing]
  );

  // Load the record into the form once it arrives.
  useEffect(() => {
    const disease = existing.data?.data;
    if (!disease) return;

    setForm({
      diseaseName: disease.diseaseName || '',
      plantName: disease.plantName || '',
      description: disease.description || '',
      severity: disease.severity || 'Medium',
      ...Object.fromEntries(
        LIST_FIELDS.map((field) => [field.key, (disease[field.key] || []).join('\n')])
      ),
      pathogenType: disease.pathogenType || '',
      favourableConditions: disease.favourableConditions || '',
      imageUrl: disease.imageUrl || '',
      mlLabels: (disease.mlLabels || []).join('\n'),
      isActive: disease.isActive !== false,
    });
  }, [existing.data]);

  const action = isEditing ? diseaseService.update : diseaseService.create;
  const { execute, loading, error, clearError } = useAsyncAction(action);

  const update = (field) => (event) =>
    setForm((prev) => ({ ...prev, [field]: event.target.value }));

  /** Arrays for the list fields, trimmed and with empty lines dropped. */
  const toPayload = () => {
    const payload = {
      diseaseName: form.diseaseName.trim(),
      plantName: form.plantName.trim(),
      description: form.description.trim(),
      severity: form.severity,
      pathogenType: form.pathogenType.trim(),
      favourableConditions: form.favourableConditions.trim(),
      imageUrl: form.imageUrl.trim(),
      isActive: form.isActive,
    };

    LIST_FIELDS.forEach((field) => {
      payload[field.key] = form[field.key]
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
    });

    payload.mlLabels = form.mlLabels
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    return payload;
  };

  /** Catch obviously incomplete records before spending a request. */
  const validate = () => {
    const problems = [];
    if (form.diseaseName.trim().length < 2) problems.push({ field: 'diseaseName', message: 'Disease name is required' });
    if (!form.plantName.trim()) problems.push({ field: 'plantName', message: 'Plant name is required' });
    if (form.description.trim().length < 10) {
      problems.push({ field: 'description', message: 'Description must be at least 10 characters' });
    }

    LIST_FIELDS.forEach((field) => {
      const lines = form[field.key]
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
      if (!lines.length) problems.push({ field: field.key, message: `${field.label} needs at least one entry` });
    });

    return problems;
  };

  const submit = async (event) => {
    event.preventDefault();
    setFieldErrors({});
    setErrorList([]);

    const problems = validate();
    if (problems.length) {
      setErrorList(problems);
      setFieldErrors(Object.fromEntries(problems.map((item) => [item.field, item.message])));
      toast.error('Please correct the highlighted fields');
      return;
    }

    const payload = toPayload();

    try {
      const response = isEditing
        ? await execute(id, payload)
        : await execute(payload);
      toast.success(response.message || 'Disease saved');
      navigate('/admin/diseases');
    } catch (thrown) {
      setFieldErrors(thrown?.fieldErrors || {});
      setErrorList(thrown?.errors || []);
      toast.error(thrown?.message || 'The disease could not be saved.');
    }
  };

  if (isEditing && existing.loading) return <FullPageLoader label="Loading disease" />;

  return (
    <form onSubmit={submit} className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            to="/admin/diseases"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-leaf-600 hover:underline dark:text-leaf-400"
          >
            <ArrowLeft className="h-4 w-4" />
            Manage diseases
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">
            {isEditing ? 'Edit disease' : 'Add disease'}
          </h1>
        </div>

        <div className="flex gap-3">
          <LinkButton to="/admin/diseases" variant="secondary">
            Cancel
          </LinkButton>
          <button type="submit" className="btn-primary" disabled={loading}>
            <Save className="h-4 w-4" />
            {loading ? 'Saving...' : isEditing ? 'Save changes' : 'Create disease'}
          </button>
        </div>
      </div>

      {existing.error ? <ErrorMessage message={existing.error} onDismiss={existing.reload} /> : null}
      {error ? <ErrorMessage message={error} onDismiss={clearError} /> : null}
      {errorList.length ? <FieldErrorList errors={errorList} /> : null}

      {/* ------------------------------------------------------- identity */}
      <section className="card space-y-4 p-6">
        <h2 className="text-lg font-semibold">Basic information</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="disease-name">
              Disease name <span className="text-red-500">*</span>
            </label>
            <input
              id="disease-name"
              className={`input ${fieldErrors.diseaseName ? 'input-error' : ''}`}
              value={form.diseaseName}
              onChange={update('diseaseName')}
              placeholder="Early Blight"
              required
              maxLength={160}
            />
            {fieldErrors.diseaseName ? <p className="form-error">{fieldErrors.diseaseName}</p> : null}
          </div>

          <div>
            <label className="label" htmlFor="disease-plant">
              Plant <span className="text-red-500">*</span>
            </label>
            <input
              id="disease-plant"
              className={`input ${fieldErrors.plantName ? 'input-error' : ''}`}
              value={form.plantName}
              onChange={update('plantName')}
              placeholder="Tomato"
              required
              maxLength={120}
            />
            {fieldErrors.plantName ? <p className="form-error">{fieldErrors.plantName}</p> : null}
          </div>
        </div>

        <div>
          <label className="label" htmlFor="disease-description">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="disease-description"
            rows={3}
            className={`input ${fieldErrors.description ? 'input-error' : ''}`}
            value={form.description}
            onChange={update('description')}
            placeholder="One or two sentences shown on the disease card."
            required
            maxLength={5000}
          />
          {fieldErrors.description ? <p className="form-error">{fieldErrors.description}</p> : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="disease-severity">
              Severity
            </label>
            <select id="disease-severity" className="input" value={form.severity} onChange={update('severity')}>
              {SEVERITIES.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-leaf-200 p-3 dark:border-leaf-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-leaf-300 text-leaf-600 focus:ring-leaf-500"
                checked={form.isActive}
                onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
              />
              <span className="text-sm">
                <span className="font-medium">Visible in the library</span>
                <span className="block text-xs text-leaf-600 dark:text-leaf-400">
                  Uncheck to hide it from users without deleting it.
                </span>
              </span>
            </label>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- bullets */}
      <section className="card space-y-4 p-6">
        <div>
          <h2 className="text-lg font-semibold">Remedy information</h2>
          <p className="mt-0.5 text-sm text-leaf-600 dark:text-leaf-400">
            One bullet point per line. All six sections are required by the schema.
          </p>
        </div>

        {LIST_FIELDS.map((field) => (
          <div key={field.key}>
            <label className="label" htmlFor={`disease-${field.key}`}>
              {field.label} <span className="text-red-500">*</span>
            </label>
            <textarea
              id={`disease-${field.key}`}
              rows={4}
              className={`input ${fieldErrors[field.key] ? 'input-error' : ''}`}
              value={form[field.key]}
              onChange={update(field.key)}
              placeholder={field.hint}
              required
            />
            {fieldErrors[field.key] ? <p className="form-error">{fieldErrors[field.key]}</p> : null}
          </div>
        ))}
      </section>

      {/* ------------------------------------------------- model mapping */}
      <section className="card space-y-4 p-6">
        <div>
          <h2 className="text-lg font-semibold">Model mapping and media</h2>
          <p className="mt-0.5 text-sm text-leaf-600 dark:text-leaf-400">
            The ML label is what links a prediction to this record, e.g.{' '}
            <code className="rounded bg-leaf-100 px-1 py-0.5 text-xs dark:bg-leaf-800">
              Tomato___Early_blight
            </code>
            .
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="disease-labels">
              ML labels
            </label>
            <textarea
              id="disease-labels"
              rows={2}
              className="input"
              value={form.mlLabels}
              onChange={update('mlLabels')}
              placeholder="One class name per line"
            />
          </div>

          <div>
            <label className="label" htmlFor="disease-image">
              Image URL
            </label>
            <input
              id="disease-image"
              type="url"
              className="input"
              value={form.imageUrl}
              onChange={update('imageUrl')}
              placeholder="https://…"
            />
          </div>

          <div>
            <label className="label" htmlFor="disease-pathogen">
              Pathogen type
            </label>
            <input
              id="disease-pathogen"
              className="input"
              value={form.pathogenType}
              onChange={update('pathogenType')}
              placeholder="Fungus"
              maxLength={120}
            />
          </div>

          <div>
            <label className="label" htmlFor="disease-conditions">
              Favourable conditions
            </label>
            <input
              id="disease-conditions"
              className="input"
              value={form.favourableConditions}
              onChange={update('favourableConditions')}
              placeholder="Warm, humid weather"
              maxLength={300}
            />
          </div>
        </div>
      </section>

      <div className="flex justify-end gap-3">
        <LinkButton to="/admin/diseases" variant="secondary">
          Cancel
        </LinkButton>
        <button type="submit" className="btn-primary" disabled={loading}>
          <Save className="h-4 w-4" />
          {loading ? 'Saving...' : isEditing ? 'Save changes' : 'Create disease'}
        </button>
      </div>
    </form>
  );
}
