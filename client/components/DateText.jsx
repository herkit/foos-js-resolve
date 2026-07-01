import React from 'react'
import moment from 'moment'

/**
 * Small replacement for react-moment's <Moment date fromNowDuring format>.
 *
 * react-moment@1.1.1 bundles moment-duration-format, which crashes on init under
 * Vite ("Cannot set properties of undefined (setting 'format')" — its
 * `moment.duration` is undefined via the CJS interop). We only ever used the
 * date/fromNow formatting, so this covers it with plain moment.
 *
 * Shows a relative time ("2 hours ago") when the date is within `fromNowDuring`
 * milliseconds of now; otherwise formats with `format`.
 */
const DateText = ({ date, className, fromNowDuring = 0, format = 'll' }) => {
  const m = moment(date)
  const withinWindow = fromNowDuring > 0 && Date.now() - m.valueOf() < fromNowDuring
  const text = withinWindow ? m.fromNow() : m.format(format)
  return <time className={className}>{text}</time>
}

export default DateText
