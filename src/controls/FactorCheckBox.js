import { React, useState } from 'react';
import { Checkbox, Typography } from '@material-ui/core';
import { makeStyles, withStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    alignItems: 'center',
  },
  label: {
    flexGrow: 1,
  },
}), { name: 'FactorCheckBox' });

const ColoredCheckbox = withStyles((theme) => ({
  root: {
    '&$checked': {
      color: theme.palette.secondary.main,
    },
    '&[data-vibe="positive"]$checked': {
      color: theme.palette.success.dark,
    },
    '&[data-vibe="negative"]$checked': {
      color: theme.palette.error.dark,
    },
  },
  checked: {},
}), { name: 'ColoredCheckbox' })((props) => <Checkbox color="default" {...props} />);

export default function FactorCheckBox(props) {
  const classes = useStyles();
  const [value, setValue] = useState(0);

  return (
    <label className={classes.root}>
      <Typography component="span" className={classes.label}>
        {props.label}
      </Typography>
      <ColoredCheckbox
        name={props.name} data-vibe={props.vibe}
        checked={value === 1}
        onChange={(e) => setValue(e.target.checked ? 1 : 0)} />
    </label>
  );
};
