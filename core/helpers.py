from datetime import date


def format_attr(attr, format_=None):
    if isinstance(attr, date):
        if format_:
            return attr.strftime(format_[0])
        else:
            return attr.isoformat()
    return attr
