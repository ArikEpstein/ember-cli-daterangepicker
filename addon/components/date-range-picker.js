import Ember from 'ember';
import moment from 'moment';
import layout from '../templates/components/date-range-picker';

const {
  run,
  isEmpty,
  computed
} = Ember;

const noop = function() {};

export default Ember.Component.extend({
  layout,
  classNameBindings: ['containerClass'],
  attributeBindings: ['start', 'end', 'serverFormat'],
  start: undefined,
  end: undefined,
  minDate: undefined,
  maxDate: undefined,
  timePicker: false,
  timePicker24Hour: false,
  timePickerSeconds: false,
  timePickerIncrement: undefined,
  showWeekNumbers: false,
  showDropdowns: false,
  linkedCalendars: false,
  datelimit: false,
  parentEl: 'body',
  format: 'MMM D, YYYY',
  serverFormat: 'YYYY-MM-DD',
  rangeText: computed('start', 'end', function() {
    let format = this.get('format');
    let serverFormat = this.get('serverFormat');
    let start = this.get('start');
    let end = this.get('end');
    if (!isEmpty(start) && !isEmpty(end)) {
      return moment(start, serverFormat).format(format) + this.get('separator') +
        moment(end, serverFormat).format(format);
    }
    return '';
  }),
  opens: null,
  drops: null,
  separator: ' - ',
  singleDatePicker: false,
  placeholder: null,
  containerClass: "form-group",
  inputClass: "form-control",
  inputClasses: computed('inputClass', function() {
    let inputClass = this.get('inputClass');
    return (inputClass ? 'daterangepicker-input ' + inputClass : 'daterangepicker-input');
  }),
  buttonClasses: ['btn'],
  applyClass: null,
  cancelClass: null,
  ranges: {
    'Yesterday': [moment().subtract(1, 'days').startOf('day'), moment().subtract(1, 'days').endOf('day')],
    'Last Week': [moment().subtract(1, 'weeks').startOf('Week'), moment().subtract(1, 'weeks').endOf('Week')],
    'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
    'Last Year': [moment().subtract(1, 'year').startOf('year'), moment().subtract(1, 'year').endOf('year')],
    'Last 5 Years': [moment().subtract(5, 'year').startOf('year'), moment().subtract('year').startOf('year')],
  },
  daysOfWeek: moment.weekdaysMin(),
  monthNames: moment.monthsShort(),
  removeDropdownOnDestroy: false,
  cancelLabel: 'Cancel',
  applyLabel: 'Apply',
  customRangeLabel: 'Custom Range',
  showCustomRangeLabel: false,
  fromLabel: 'From',
  toLabel: 'To',
  hideAction: null,
  applyAction: null,
  cancelAction: null,
  autoUpdateInput: true,
  autoApply: false,
  alwaysShowCalendars: false,
  context: undefined,
  firstDay: 0,
  isInvalidDate: noop,
  isCustomDate: noop,

  // Init the dropdown when the component is added to the DOM
  didInsertElement() {
    this._super(...arguments);
    this.setupPicker();
  },

  didUpdateAttrs() {
    this._super(...arguments);
    this.setupPicker();
  },

  // Remove the hidden dropdown when this component is destroyed
  willDestroy() {
    this._super(...arguments);

    run.cancel(this._setupTimer);

    if (this.get('removeDropdownOnDestroy')) {
      Ember.$('.daterangepicker').remove();
    }
  },

  getOptions() {
    let momentStartDate = moment(this.get('start'), this.get('serverFormat'));
    let momentEndDate = moment(this.get('end'), this.get('serverFormat'));
    let startDate = momentStartDate.isValid() ? momentStartDate : undefined;
    let endDate = momentEndDate.isValid() ? momentEndDate : undefined;

    let momentMinDate = moment(this.get('minDate'), this.get('serverFormat'));
    let momentMaxDate = moment(this.get('maxDate'), this.get('serverFormat'));
    let minDate = momentMinDate.isValid() ? momentMinDate : undefined;
    let maxDate = momentMaxDate.isValid() ? momentMaxDate : undefined;

    let showCustomRangeLabel = this.get('showCustomRangeLabel');

    let options = this.getProperties(
      'isInvalidDate',
      'isCustomDate',
      'alwaysShowCalendars',
      'autoUpdateInput',
      'autoApply',
      'timePicker',
      'buttonClasses',
      'applyClass',
      'cancelClass',
      'singleDatePicker',
      'drops',
      'opens',
      'timePicker24Hour',
      'timePickerSeconds',
      'timePickerIncrement',
      'showWeekNumbers',
      'showDropdowns',
      'showCustomRangeLabel',
      'linkedCalendars',
      'dateLimit',
      'parentEl'
    );

    let localeOptions = this.getProperties(
      'applyLabel',
      'cancelLabel',
      'customRangeLabel',
      'fromLabel',
      'toLabel',
      'format',
      'firstDay',
      'daysOfWeek',
      'monthNames',
      'separator'
    );

    const defaultOptions = {
      locale: localeOptions,
      showCustomRangeLabel: showCustomRangeLabel,
      startDate: startDate,
      endDate: endDate,
      minDate: minDate,
      maxDate: maxDate,
    };

    if (!this.get('singleDatePicker')) {
      options.ranges = this.get('ranges');
    }

    return { ...options, ...defaultOptions };
  },

  setupPicker() {
    run.cancel(this._setupTimer);
    this._setupTimer = run.scheduleOnce('afterRender', this, this._setupPicker);
  },

  _setupPicker() {
    this.$('.daterangepicker-input').daterangepicker(this.getOptions());
    this.attachPickerEvents();
  },

  attachPickerEvents() {
    this.$('.daterangepicker-input').on('apply.daterangepicker', (ev, picker) => {
      this.handleDateRangePickerEvent('applyAction', picker);
    });

    this.$('.daterangepicker-input').on('hide.daterangepicker', (ev, picker) => {
      this.handleDateRangePickerEvent('hideAction', picker);
    });

    this.$('.daterangepicker-input').on('cancel.daterangepicker', () => {
      this.handleDateRangePickerEvent('cancelAction', undefined, true);
    });
  },

  handleDateRangePickerEvent(actionName, picker, isCancel = false) {
    let action = this.get(actionName);
    let start;
    let end;

    if (!isCancel) {
      start = picker.startDate.format(this.get('serverFormat'));
      end = picker.endDate.format(this.get('serverFormat'));
    }

    if (action) {
      Ember.assert(
        `${actionName} for date-range-picker must be a function`,
        typeof action === 'function'
      );
      this.sendAction(actionName, start, end, picker);
    } else {
      if (!this.isDestroyed) {
        this.setProperties({ start, end });
      }
    }
  }
});
