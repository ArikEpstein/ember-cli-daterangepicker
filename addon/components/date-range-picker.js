import { assert } from '@ember/debug';
import $ from 'jquery';
import Component from '@ember/component';
import { run } from '@ember/runloop';
import { isEmpty } from '@ember/utils';
import { computed, set, get, getProperties, setProperties } from '@ember/object';
import moment from 'moment';
import layout from '../templates/components/date-range-picker';

const noop = function() {};

export default Component.extend({
  layout,
  isShown: false,
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
  endpointCalendars: true,
  datelimit: false,
  parentEl: 'body',
  format: 'MMM D, YYYY',
  serverFormat: 'YYYY-MM-DD',
  rangeText: computed('start', 'end', function() {
    let format = get(this, 'format');
    let serverFormat = get(this, 'serverFormat');
    let start = get(this, 'start');
    let end = get(this, 'end');
    if (!isEmpty(start) && !isEmpty(end)) {
      return moment(start, serverFormat).format(format) + get(this, 'separator') +
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
    let inputClass = get(this, 'inputClass');
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

    if (get(this, 'removeDropdownOnDestroy')) {
      $('.daterangepicker').remove();
    }
  },

  getOptions() {
    let momentStartDate = moment(get(this, 'start'), get(this, 'serverFormat'));
    let momentEndDate = moment(get(this, 'end'), get(this, 'serverFormat'));
    let startDate = momentStartDate.isValid() ? momentStartDate : undefined;
    let endDate = momentEndDate.isValid() ? momentEndDate : undefined;

    let momentMinDate = moment(get(this, 'minDate'), get(this, 'serverFormat'));
    let momentMaxDate = moment(get(this, 'maxDate'), get(this, 'serverFormat'));
    let minDate = momentMinDate.isValid() ? momentMinDate : undefined;
    let maxDate = momentMaxDate.isValid() ? momentMaxDate : undefined;

    let showCustomRangeLabel = get(this, 'showCustomRangeLabel');

    let options = getProperties(
      this,
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
      'endpointCalendars',
      'dateLimit',
      'parentEl'
    );

    let localeOptions = getProperties(
      this,
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

    if (!get(this, 'singleDatePicker')) {
      options.ranges = get(this, 'ranges');
    }

    return { ...options, ...defaultOptions };
  },

  setupPicker() {
    run.cancel(this._setupTimer);
    this._setupTimer = run.scheduleOnce('afterRender', this, this._setupPicker);
  },

  _setupPicker() {
    $('.daterangepicker-input').daterangepicker(this.getOptions());
    this.attachPickerEvents();
  },

  attachPickerEvents() {
    $('.daterangepicker-input').on('show.daterangepicker', () => {
      set(this, "isShown", true);
      this.sendAction('openAction');
    });

    $('.daterangepicker-input').on('apply.daterangepicker', (ev, picker) => {
      set(this, "isShown", false);
      this.handleDateRangePickerEvent('applyAction', picker);
    });

    $('.daterangepicker-input').on('hide.daterangepicker', (ev, picker) => {
      set(this, "isShown", false);
      this.handleDateRangePickerEvent('hideAction', picker);
    });

    $('.daterangepicker-input').on('cancel.daterangepicker', () => {
      set(this, "isShown", false);
      this.handleDateRangePickerEvent('cancelAction', undefined, true);
    });
  },

  handleDateRangePickerEvent(actionName, picker, isCancel = false) {
    let action = get(this, actionName);
    let start;
    let end;

    if (!isCancel) {
      start = picker.startDate.format(get(this, 'serverFormat'));
      end = picker.endDate.format(get(this, 'serverFormat'));
    }

    if (action) {
      assert(
        `${actionName} for date-range-picker must be a function`,
        typeof action === 'function'
      );
      this.sendAction(actionName, start, end, picker);
    } else {
      if (!this.isDestroyed) {
        setProperties(this, { start, end });
      }
    }
  }
});
